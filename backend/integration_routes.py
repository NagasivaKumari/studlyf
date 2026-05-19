from datetime import datetime, timezone
import asyncio
import os
import re
import uuid
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, Form, File, UploadFile, Body, Depends, Query
from auth_institution import get_auth_user, assert_institution_scope, assert_institution_owns_event
from services.email_service import send_notification_email, get_certificate_template, get_shortlist_template, get_announcement_template
from services.institutional_analytics_service import analytics_service
from services.institutional_certificate_service import certificate_service
from services.leaderboard_service import leaderboard_service
from db import leaderboard_col, events_col, participants_col, certificates_col, notifications_col, institutions_col, users_col, teams_col, submissions_col, submission_data_col, scores_col, results_col, audit_logs_col, opportunities_col, opportunity_applications_col, hackathon_submissions_col
from bson import ObjectId
from services.audit_service import log_admin_action
from notification_helpers import notify_institution
from quiz_visibility_service import quiz_visibility_service, _check_quiz_visibility
import logging

# Ensure upload directory exists
EVENTS_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "events")
os.makedirs(EVENTS_UPLOAD_DIR, exist_ok=True)

BASE_URL = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000")

logger = logging.getLogger(__name__)


def _event_id_query(event_id: str) -> dict:
    """
    Build a MongoDB query that finds an event regardless of whether
    the event_id is a 24-char ObjectId hex or a UUID/string.
    Prevents bson.errors.InvalidId crashes on UUID-format IDs.
    """
    from bson.errors import InvalidId
    or_clauses = [{"_id": event_id}]  # string _id fallback
    try:
        or_clauses.append({"_id": ObjectId(event_id)})
    except (InvalidId, ValueError):
        pass
    return {"$or": or_clauses}


async def _list_submissions_for_judge_user(user: dict, event_id: Optional[str] = None) -> list:
    """Return submitted projects specifically assigned to the authenticated user's email."""
    email = (user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Your account must have an email to load judge assignments")
    q = {"status": "Submitted"}
    if event_id:
        q["event_id"] = event_id
    out = []
    async for doc in submissions_col.find(q):
        assigned = doc.get("assigned_judge_emails") or []
        # CRITICAL: If no judge assigned, or this judge is not assigned, skip.
        norm = {str(a).strip().lower() for a in assigned if a}
        if email not in norm:
            continue
            
        row = dict(doc)
        row["_id"] = str(row["_id"])
        
        # PRIVACY: Sanitize student contact data
        sanitized_data = row.get("data", {}).copy()
        for field in ['user_email', 'user_name', 'email', 'contact', 'phone']:
            if field in sanitized_data:
                del sanitized_data[field]
        row["data"] = sanitized_data
        
        # CLEANUP: Remove other judge emails for privacy
        if "assigned_judge_emails" in row:
            del row["assigned_judge_emails"]
            
        out.append(row)
    return out


async def _dispatch_status_email(target_id: str, status: str, doc: dict):
    """Sends a status update email to team leader AND all team members."""
    from services.email_service import send_notification_email
    
    # Get all team member emails
    recipient_emails = []
    user_name = "Participant"
    event_id = doc.get("event_id")
    
    # 1. Try to get emails from doc directly
    leader_email = doc.get("email") or doc.get("user_email")
    leader_name = doc.get("team_name") or doc.get("full_name") or doc.get("user_name") or "Participant"
    
    if leader_email:
        recipient_emails.append(leader_email)
        user_name = leader_name
    
    # 2. If team, get all team member emails
    team_id = doc.get("team_id") or doc.get("_id")
    if team_id:
        try:
            team = await teams_col.find_one({"_id": ObjectId(team_id)})
            if team:
                # Get leader email
                leader_id = team.get("team_leader_id") or team.get("leader_id")
                if leader_id:
                    leader_rec = await users_col.find_one({"user_id": leader_id})
                    if leader_rec and leader_rec.get("email"):
                        if leader_rec.get("email") not in recipient_emails:
                            recipient_emails.append(leader_rec.get("email"))
                            if not leader_email:  # Use leader name if not set earlier
                                user_name = leader_rec.get("full_name") or leader_rec.get("name") or "Team"
                
                # Get all team member emails
                members = team.get("members", [])
                for member in members:
                    member_id = member.get("user_id")
                    if member_id:
                        member_rec = await users_col.find_one({"user_id": member_id})
                        if member_rec and member_rec.get("email"):
                            member_email = member_rec.get("email")
                            if member_email not in recipient_emails:
                                recipient_emails.append(member_email)
        except (TypeError, ValueError, KeyError) as e:
            logger.warning(f"[EMAIL] Could not fetch team members: {e}")
    
    # 3. Fallback for solo participants
    if not recipient_emails:
        uid = doc.get("team_leader_id") or doc.get("user_id")
        if uid:
            user_rec = await users_col.find_one({"user_id": uid})
            if user_rec:
                recipient_emails.append(user_rec.get("email"))
                user_name = user_rec.get("full_name") or user_rec.get("name") or "Participant"

    if not recipient_emails:
        logger.warning(f"[EMAIL] Skipping status email for {target_id}: No emails found")
        return

    # Get event title
    event_title = "your event"
    next_round_name = "Next Round"
    if event_id:
        event = await events_col.find_one(_event_id_query(str(event_id)))
        if event:
            event_title = event.get("title", "your event")
            # Smart Round Detection: Try to find what they qualified for
            stages = event.get("stages") or []
            current_stage_name = doc.get("current_stage")
            
            if current_stage_name:
                for i, s in enumerate(stages):
                    if s.get("name") == current_stage_name and i + 1 < len(stages):
                        next_round_name = stages[i+1].get("name")
                        break
            elif stages:
                next_round_name = stages[0].get("name")

    from services.email_service import get_shortlist_template
    
    if status == "Shortlisted":
        subject = f"CONGRATULATIONS: {user_name} is moving to {next_round_name}!"
        body_html = get_shortlist_template(user_name, event_title, next_round_name)
    else:
        subject = f"Update on your submission for {event_title}"
        status_colors = {
            "Shortlisted": "#6C3BFF",
            "Approved": "#10B981",
            "Rejected": "#EF4444"
        }
        color = status_colors.get(status, "#6C3BFF")
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #edf2f7; border-radius: 24px; background: white;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; padding: 12px; background: {color}10; border-radius: 16px; margin-bottom: 15px;">
                            <span style="font-size: 32px;">📢</span>
                        </div>
                        <h2 style="color: #1a202c; margin: 0; font-size: 24px; font-weight: 800;">Status Update</h2>
                    </div>

                    <p>Hello <strong>{user_name}</strong>,</p>
                    <p>We have an update regarding your project for <strong>{event_title}</strong>.</p>
                    
                    <div style="margin: 30px 0; padding: 25px; background: {color}08; border: 2px dashed {color}20; border-radius: 20px; text-align: center;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #64748b;">Current Status</p>
                        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 900; color: {color}; text-transform: uppercase;">{status}</p>
                    </div>

                    <p style="color: #4a5568;">
                        {f"Congratulations! You have been <strong>{status.lower()}</strong>. Next steps will be shared soon." if status != "Rejected" else "Thank you for your participation. Unfortunately, your project was not selected for the next phase."}
                    </p>

                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #edf2f7; text-align: center; color: #a0aec0; font-size: 12px;">
                        This is an automated notification from the Studlyf Institutional Portal.<br>
                        Please do not reply directly to this email.
                    </div>
                </div>
            </body>
        </html>
        """

    try:
        # Send to all team members
        success_count = 0
        for email in recipient_emails:
            try:
                await send_notification_email(email, subject, body_html)
                success_count += 1
                logger.info(f"[EMAIL SUCCESS] Sent {status} notification to {email}")
            except Exception as e:
                logger.error(f"[EMAIL ERROR] Failed to send {status} email to {email}: {str(e)}")
        
        logger.info(f"[EMAIL SUMMARY] Sent {status} notification to {success_count}/{len(recipient_emails)} team members")
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send {status} emails: {str(e)}")


router = APIRouter(prefix="/api/v1/institution", tags=["Institutional Integration"])

@router.patch("/submissions/{submission_id}/status")
@router.get("/submissions/{submission_id}/status") # Debug GET
async def update_institutional_status(submission_id: str, status_data: dict = Body(None), user: dict = Depends(get_auth_user)):
    """
    Updates the institutional status (Shortlisted, Approved, Rejected) for a team or solo project.
    Intelligently handles team_id, submission_id (solo), or submission_data_id.
    """
    # For GET requests, we just return current status if possible
    if status_data is None:
        # Debug logic to check if route is reachable
        return {"status": "reachable", "id": submission_id}
        
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Missing status")

    # 0. Check if the ID is a submission_data_id (asset ID)
    sd_id_query = {"$or": [{"_id": submission_id}]}
    try: sd_id_query["$or"].append({"_id": ObjectId(submission_id)})
    except: pass
    
    asset_doc = await submission_data_col.find_one(sd_id_query)
    target_id = submission_id
    
    if asset_doc:
        target_id = asset_doc.get("team_id") or asset_doc.get("user_id") or submission_id
        await submission_data_col.update_one(sd_id_query, {"$set": {"status": status}})

    # 1. Try updating as a team
    t_id_query = {"$or": [{"_id": target_id}]}
    try: t_id_query["$or"].append({"_id": ObjectId(target_id)})
    except: pass

    try:
        t_res = await teams_col.update_one(
            t_id_query,
            {"$set": {
                "institution_selection": status,
                "selection_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if t_res.modified_count > 0:
            return {"status": "success", "message": f"Team status updated to {status}"}
    except Exception as e:
        logger.error(f"[STATUS ERROR] Team update failed: {str(e)}")

    # 2. Try updating as a solo submission
    s_id_query = {"$or": [{"_id": target_id}]}
    try: s_id_query["$or"].append({"_id": ObjectId(target_id)})
    except: pass

    try:
        s_res = await submissions_col.update_one(
            s_id_query,
            {"$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        if s_res.modified_count > 0:
            return {"status": "success", "message": f"Submission status updated to {status}"}
    except Exception as e:
        logger.error(f"[STATUS ERROR] Submission update failed: {str(e)}")

    # 3. Try updating Opportunity Applications (Crucial for Student Dashboard)
    try:
        # Determine the user_id to update
        # If target_id is a team_id, we should find the leader's user_id
        actual_user_id = target_id
        team = await teams_col.find_one({"team_id": target_id})
        if not team:
            try:
                if len(target_id) == 24: team = await teams_col.find_one({"_id": ObjectId(target_id)})
            except: pass
            
        if team:
            actual_user_id = team.get("team_leader_id") or team.get("leader_id")
            logger.info(f"[STATUS] Team detected. Updating opportunity application for leader: {actual_user_id}")

        if actual_user_id:
            oa_res = await opportunity_applications_col.update_many(
                {"user_id": actual_user_id},
                {"$set": {
                    "status": status.lower(),
                    "reviewed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            if oa_res.modified_count > 0:
                logger.info(f"[STATUS] Updated {oa_res.modified_count} opportunity applications for {actual_user_id}")
    except Exception as e:
        logger.error(f"[STATUS ERROR] Opportunity application update failed: {str(e)}")

    # 4. Check if it was already that status
    exists_team = await teams_col.find_one(t_id_query)
    exists_sub = await submissions_col.find_one(s_id_query)
    
    # [NEW] Dispatch Email Notifications
    if status in ["Shortlisted", "Approved", "Rejected"]:
        target_doc = exists_team or exists_sub
        if target_doc:
            asyncio.create_task(_dispatch_status_email(target_id, status, target_doc))

    if exists_team or exists_sub:
        return {"status": "success", "message": "Status synchronized"}

    raise HTTPException(status_code=404, detail=f"Entity {target_id} not found for status update")

@router.post("/test-email")
async def test_email_configuration(user: dict = Depends(get_auth_user)):
    """Verifies that SMTP settings are working by sending a test email."""
    from services.email_service import send_notification_email
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Authenticated user has no email")
    
    subject = "🔔 Studlyf SMTP Test"
    body = f"<h1>Connection Successful!</h1><p>This is a test email to verify your SMTP configuration. If you received this, your email system is properly connected.</p>"
    
    success = await send_notification_email(email, subject, body)
    if success:
        return {"status": "success", "message": f"Test email sent to {email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email. Check your SMTP credentials in the environment.")


@router.post("/profile")
async def create_institution_profile(profile: dict):
    """Saves a new institution profile to MongoDB."""
    from db import institutions_col
    inst_id = str(profile.get("institution_id", "unknown")).strip()
    
    # CRITICAL: Remove MongoDB's internal _id to avoid immutable field errors
    if "_id" in profile:
        del profile["_id"]
        
    profile["institution_id"] = inst_id 
    profile["updated_at"] = datetime.utcnow()
    
    await institutions_col.update_one(
        {"institution_id": inst_id},
        {"$set": profile},
        upsert=True
    )
    return {"status": "success"}

@router.get("/profile/{institution_id}")
async def get_institution_profile(institution_id: str):
    """Retrieves the full profile of an institution including team and social links."""
    profile = await institutions_col.find_one({"institution_id": institution_id})
    if not profile:
        # Don't return fallback - return 404 to force proper institution setup
        raise HTTPException(status_code=404, detail="Institution profile not found. Please complete institution setup.")
    
    # Clean ID
    if "_id" in profile:
        profile["_id"] = str(profile["_id"])
    return profile

@router.get("/summary/{institution_id}")
async def fetch_summary(institution_id: str, user: dict = Depends(get_auth_user)):
    """Dynamically aggregates real-time metrics for the dashboard."""
    assert_institution_scope(institution_id, user)
    return await analytics_service.get_kpi_summary(institution_id)

@router.get("/events/{institution_id}")
async def get_all_events(institution_id: str, user: dict = Depends(get_auth_user)):
    """Institution listings: events from `events` plus standalone opportunities (jobs/internships).

    Rows mirrored from events (`event_link_id` → event `_id`) are omitted to avoid duplicate titles
    and wrong IDs when opening Event Details (which expects an event id).
    Registration counts combine `participants` and portal applications on the linked opportunity.
    """
    assert_institution_scope(institution_id, user)
    from db import opportunity_applications_col

    events_list = []
    event_ids = set()

    e_cursor = events_col.find({"institution_id": institution_id})
    async for event in e_cursor:
        eid = str(event["_id"])
        event_ids.add(eid)
        event["_id"] = eid

        booth = await participants_col.count_documents({"event_id": eid})
        linked = await opportunities_col.find_one({"event_link_id": eid})
        portal = 0
        if linked:
            portal = await opportunity_applications_col.count_documents({"opportunity_id": str(linked["_id"])})
        event["participant_count"] = booth + portal
        events_list.append(event)

    o_cursor = opportunities_col.find({
        "$or": [{"institution_id": institution_id}, {"createdBy": institution_id}]
    })
    async for opp in o_cursor:
        link = opp.get("event_link_id")
        if link and str(link) in event_ids:
            continue

        opp_id = str(opp["_id"])
        opp["_id"] = opp_id
        opp["organisation"] = opp.get("organisation") or opp.get("organization") or ""
        opp["participant_count"] = await opportunity_applications_col.count_documents({"opportunity_id": opp_id})
        opp["status"] = opp.get("status", "Active").upper()
        opp["category"] = opp.get("type", "Opportunity")
        events_list.append(opp)

    def _sort_key(x):
        val = x.get("created_at") or x.get("createdAt") or x.get("deadline") or ""
        # Normalize datetime objects to ISO string so str/datetime comparison never occurs
        if hasattr(val, "isoformat"):
            return val.isoformat()
        return str(val)

    events_list.sort(key=_sort_key, reverse=True)

    return events_list

@router.delete("/events/{event_id}")
async def delete_institution_listing(event_id: str, user: dict = Depends(get_auth_user)):
    """Deletes an event or a standalone opportunity listing owned by the institution."""
    from db import events_col, opportunities_col
    from bson import ObjectId
    
    # Try deleting from events first
    try:
        event_result = await events_col.delete_one({"_id": ObjectId(event_id)})
        if event_result.deleted_count > 0:
            # Also clean up any associated opportunities mirrored from this event
            await opportunities_col.delete_many({"event_link_id": event_id})
            return {"status": "success", "message": "Event deleted successfully"}
    except Exception:
        pass
        
    # Try deleting from standalone opportunities
    try:
        opp_result = await opportunities_col.delete_one({"_id": ObjectId(event_id)})
        if opp_result.deleted_count > 0:
            return {"status": "success", "message": "Opportunity deleted successfully"}
    except Exception:
        pass
        
    raise HTTPException(status_code=404, detail="Listing not found")

@router.get("/events/{event_id}/participants")
async def get_event_participants(event_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves all students registered for a specific event, including opportunity applicants."""
    await assert_institution_owns_event(event_id, user)
    from db import opportunity_applications_col, opportunities_col
    from bson import ObjectId
    
    students = []
    seen_row_ids = set()
    seen_user_ids = set()

    # Robust event_id variants
    ev_id_variants = [event_id, str(event_id)]
    try:
        if len(str(event_id)) == 24:
            ev_id_variants.append(ObjectId(event_id))
    except:
        pass

    linked_opp = await opportunities_col.find_one({"event_link_id": {"$in": ev_id_variants}})
    opp_id_ctx = str(linked_opp["_id"]) if linked_opp else None

    # 1. Traditional participants collection
    cursor = participants_col.find({"event_id": {"$in": ev_id_variants}})
    async for student in cursor:
        sid = str(student["_id"])
        student["_id"] = sid
        student["full_name"] = student.get("full_name") or student.get("name") or "Student"
        if opp_id_ctx:
            student["opportunity_id"] = opp_id_ctx
        oaid = student.get("opportunity_application_id")
        if oaid is not None:
            student["opportunity_application_id"] = str(oaid)
        seen_row_ids.add(sid)
        u = student.get("user_id")
        if u:
            seen_user_ids.add(str(u))
        students.append(student)

    # 2. Merge portal applicants not already represented in participants_col
    try:
        if linked_opp and opp_id_ctx:
            opp_id = opp_id_ctx
            app_cursor = opportunity_applications_col.find({"opportunity_id": opp_id})
            async for app in app_cursor:
                aid = str(app["_id"])
                uid = str(app.get("user_id") or "")
                if uid and uid in seen_user_ids:
                    continue
                if aid in seen_row_ids:
                    continue
                seen_row_ids.add(aid)
                if uid:
                    seen_user_ids.add(uid)
                students.append({
                    "_id": aid,
                    "opportunity_application_id": aid,
                    "opportunity_id": opp_id,
                    "user_id": uid or None,
                    "full_name": app.get("name") or "Applicant",
                    "email": app.get("email"),
                    "event_id": event_id,
                    "status": app.get("status", "pending"),
                    "registered_at": app.get("applied_at"),
                    "resume_url": app.get("resume_url"),
                    "interest_reason": app.get("interest_reason"),
                    "registration_responses": app.get("registration_responses"),
                    "source": "opportunity_application",
                })
    except Exception as e:
        logger.error(f"[PARTICIPANTS] Failed to fetch opportunity applicants: {e}")

    # 3. Merge hackathon submissions (Submission-Only Mode)
    try:
        hackathon_id_variants = [str(v) for v in ev_id_variants]
        if opp_id_ctx:
            hackathon_id_variants.append(opp_id_ctx)
            
        h_cursor = hackathon_submissions_col.find({"hackathonId": {"$in": hackathon_id_variants}})
        async for sub in h_cursor:
            uid = sub.get("submittedBy") or sub.get("user_id")
            if uid and str(uid) in seen_user_ids:
                continue
            
            sid = str(sub["_id"])
            if sid in seen_row_ids:
                continue
            
            seen_row_ids.add(sid)
            if uid:
                seen_user_ids.add(str(uid))
            
            # Detailed hydration from users collection
            u_name = sub.get("teamLead") or "Hackathon Participant"
            u_email = sub.get("email") or "Subscribed via Hackathon"
            u_college = sub.get("college_name") or sub.get("institutionId")
            
            if uid:
                from db import users_col
                u_profile = await users_col.find_one({"user_id": uid})
                if u_profile:
                    u_name = u_profile.get("full_name") or u_profile.get("name") or u_name
                    u_email = u_profile.get("email") or u_email
                    u_college = u_profile.get("college_name") or u_profile.get("institution_name") or u_college

            students.append({
                "_id": sid,
                "user_id": uid,
                "full_name": u_name,
                "email": u_email,
                "event_id": event_id,
                "registration_status": "Registered",
                "registered_at": sub.get("createdAt"),
                "source": "hackathon_submission",
                "college_name": u_college
            })
    except Exception as e:
        logger.error(f"[PARTICIPANTS] Failed to fetch hackathon submissions: {e}")

    return students


@router.get("/events/{event_id}/teams")
async def get_event_teams(event_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves all teams registered for a specific event."""
    await assert_institution_owns_event(event_id, user)
    
    # Robust event_id variants
    ev_id_variants = [event_id, str(event_id)]
    try:
        if len(str(event_id)) == 24:
            ev_id_variants.append(ObjectId(event_id))
    except:
        pass

    from db import teams_col
    cursor = teams_col.find({"event_id": {"$in": ev_id_variants}})
    teams = []
    seen_team_names = set()
    async for team in cursor:
        team["_id"] = str(team["_id"])
        
        # Enrich with member details
        if "members" in team:
            member_user_ids = [str(m.get("user_id")) for m in team["members"] if m.get("user_id")]
            if member_user_ids:
                from db import users_col
                users_cursor = users_col.find({"user_id": {"$in": member_user_ids}})
                user_map = {}
                async for u in users_cursor:
                    user_map[str(u["user_id"])] = {
                        "name": u.get("full_name") or u.get("name") or "Student",
                        "email": u.get("email")
                    }
                
                for m in team["members"]:
                    uid = str(m.get("user_id"))
                    if uid in user_map:
                        m["name"] = user_map[uid]["name"]
                        m["email"] = user_map[uid]["email"]
                        m["is_leader"] = (str(team.get("team_leader_id") or team.get("leader_id")) == uid)
                        
        teams.append(team)
        seen_team_names.add(team.get("team_name") or team.get("name"))

    # 2. Merge Hackathon Submission Teams
    try:
        # Resolve linked opportunity ID for cross-referencing hackathon submissions
        from db import opportunities_col
        linked_opp = await opportunities_col.find_one({"event_link_id": {"$in": ev_id_variants}})
        opp_id_ctx = str(linked_opp["_id"]) if linked_opp else None
        
        hackathon_id_variants = [str(v) for v in ev_id_variants]
        if opp_id_ctx:
            hackathon_id_variants.append(opp_id_ctx)

        h_cursor = hackathon_submissions_col.find({"hackathonId": {"$in": hackathon_id_variants}})
        async for sub in h_cursor:
            t_name = sub.get("teamName")
            if not t_name: continue
            if t_name in seen_team_names: continue
            
            seen_team_names.add(t_name)
            
            members = [{"user_id": sub.get("submittedBy"), "name": sub.get("teamLead"), "role": "Lead"}]
            for m_name in (sub.get("teamMembers") or []):
                members.append({"name": m_name, "role": "Member"})
                
            teams.append({
                "_id": str(sub["_id"]),
                "team_name": t_name,
                "event_id": event_id,
                "team_leader_id": sub.get("submittedBy"),
                "members": members,
                "status": "Approved",
                "formed_at": sub.get("createdAt"),
                "source": "hackathon_submission"
            })
    except Exception as e:
        logger.error(f"[TEAMS] Failed to fetch hackathon submission teams: {e}")

    return teams


@router.post("/tools/backfill-portal-participants/{institution_id}")
async def backfill_portal_participants_route(institution_id: str, user: dict = Depends(get_auth_user)):
    """One-time sync: portal applications → ``participants`` for all events owned by this institution."""
    assert_institution_scope(institution_id, user)
    from services.opportunity_service import backfill_portal_participants_for_institution

    return await backfill_portal_participants_for_institution(institution_id)


@router.patch("/opportunity-applications/status")
async def institution_review_opportunity_application(data: dict = Body(...), user: dict = Depends(get_auth_user)):
    """Set portal application status (pending | accepted | rejected | shortlisted). Institution-only."""
    from services.opportunity_service import set_opportunity_application_review_status

    institution_id = data.get("institution_id")
    if not institution_id:
        raise HTTPException(status_code=400, detail="institution_id is required")
    assert_institution_scope(str(institution_id), user)
    try:
        out = await set_opportunity_application_review_status(
            institution_id=str(institution_id),
            new_status=str(data.get("status", "pending")),
            application_id=data.get("application_id"),
            user_id=data.get("user_id"),
            opportunity_id=data.get("opportunity_id"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not allowed to update this application")
    
    if not out:
        raise HTTPException(status_code=404, detail="Application not found")
    return out

@router.post("/trigger-global-reminders")
async def trigger_global_reminders(institution_id: str = Query(...), user: dict = Depends(get_auth_user)):
    """
    Manually triggers the participant notification engine for all events 
    linked to this institution.
    """
    assert_institution_scope(institution_id, user)
    from services.reminder_service import reminder_service
    
    # We run it as a task to not block the request
    asyncio.create_task(reminder_service.send_participant_reminders())
    
    return {"status": "success", "message": "Global notification protocol initiated."}

@router.post("/events/{event_id}/send-reminders")
async def send_event_deadline_reminders(event_id: str, user: dict = Depends(get_auth_user)):
    """
    Institution triggers deadline reminder emails to all registered participants
    for the current active stage.
    """
    await assert_institution_owns_event(user, event_id)
    
    ev = await events_col.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Find next deadline
    from services.opportunity_service import _safe_dt
    now = datetime.utcnow()
    stages = ev.get("stages") or []
    next_stage = None
    next_deadline = None
    
    for s in stages:
        end = _safe_dt(s.get("deadline") or s.get("endDate") or s.get("end_date"))
        if end and end > now:
            if not next_deadline or end < next_deadline:
                next_deadline = end
                next_stage = s
    
    if not next_stage:
        return {"status": "success", "message": "No upcoming deadlines found."}
        
    # Fetch all participants
    participants = await participants_col.find({"event_id": str(event_id)}).to_list(length=5000)
    emails = [p.get("email") for p in participants if p.get("email")]
    
    if not emails:
        return {"status": "success", "message": "No participants found to email."}
        
    subject = f"Deadline Reminder: {ev.get('title')} - {next_stage.get('name')}"
    deadline_str = next_deadline.strftime("%d %B, %Y at %I:%M %p")
    
    # Send emails in background
    for email in set(emails):
        body = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 20px; background: #fff;">
                    <h2 style="color: #6C3BFF;">⏰ Deadline Approaching!</h2>
                    <p>This is a friendly reminder for <strong>{ev.get('title')}</strong>.</p>
                    <p>The submission window for <strong>{next_stage.get('name')}</strong> is closing soon.</p>
                    <div style="background: #F5F3FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p style="margin: 0; color: #7C3AED; font-weight: bold;">Submission Deadline:</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px;">{deadline_str}</p>
                    </div>
                    <p>Please ensure you have uploaded your files or links before the cutoff. Late submissions will not be accepted.</p>
                    <br>
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/#/events/{event_id}" 
                       style="background: #6C3BFF; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                       View Event Dashboard
                    </a>
                    <br><br>
                    <p style="font-size: 12px; color: #999;">Best Regards,<br>{ev.get('organisation') or 'Organizing Team'}</p>
                </div>
            </body>
        </html>
        """
        asyncio.create_task(send_notification_email(email, subject, body))
        
    return {"status": "success", "count": len(emails), "stage": next_stage.get("name")}

@router.get("/participants/{institution_id}")
async def get_all_institution_participants(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves all participants AND opportunity applicants for this institution."""
    assert_institution_scope(institution_id, user)
    from db import opportunity_applications_col
    
    # 1. Fetch Hackathon Participants
    p_cursor = participants_col.find({"institution_id": institution_id}).sort("registered_at", -1)
    results = []
    from db import users_col, events_col
    from bson import ObjectId
    
    async for p in p_cursor:
        p["_id"] = str(p["_id"])
        
        # Hydrate Event Title
        if "event_title" not in p and "event_id" in p:
            event = await events_col.find_one({"_id": ObjectId(p["event_id"])})
            p["event_title"] = event["title"] if event else "Unknown Event"
            
        # Hydrate User Details (Name, Email, Resume)
        if "user_id" in p:
            user = await users_col.find_one({"user_id": p["user_id"]})
            if user:
                p["full_name"] = user.get("full_name") or user.get("name") or "Student"
                p["email"] = user.get("email") or "No Email"
                if "resume_url" not in p:
                    p["resume_url"] = user.get("resume_url")
                    
        results.append(p)

    # 2. Fetch Opportunity Applicants (Jobs/Internships/Hackathons)
    from db import opportunities_col
    opps = await opportunities_col.find({
        "$or": [{"institution_id": institution_id}, {"createdBy": institution_id}]
    }).to_list(length=1000)
    opp_ids = [str(o["_id"]) for o in opps]
    opp_map = {str(o["_id"]): o.get("title", "Opportunity") for o in opps}
    
    app_cursor = opportunity_applications_col.find({
        "$or": [
            {"institution_id": institution_id},
            {"opportunity_id": {"$in": opp_ids}}
        ]
    }).sort("applied_at", -1)
    
    # We use a set to avoid duplicates if an app matches both conditions
    seen_apps = set()
    async for app in app_cursor:
        app_id = str(app["_id"])
        if app_id in seen_apps:
            continue
        seen_apps.add(app_id)
        
        opp_title = opp_map.get(str(app.get("opportunity_id")), "Opportunity Application")
        results.append({
            "_id": app_id,
            "full_name": app.get("name") or "Applicant",
            "email": app.get("email"),
            "phone": "N/A",
            "event_title": opp_title,
            "status": app.get("status", "pending"),
            "registered_at": app.get("applied_at"),
            "resume_url": app.get("resume_url") # Added resume support
        })
        
    return results

@router.get("/events/{event_id}/qualified-bundle")
async def get_qualified_bundle(event_id: str, threshold: float = 80.0, user: dict = Depends(get_auth_user)):
    ev_id_variants = [event_id]
    try:
        ev_id_variants.append(ObjectId(event_id))
    except Exception:
        pass
    
    event = await events_col.find_one({"_id": {"$in": ev_id_variants}})
    if not event: raise HTTPException(status_code=404, detail="Event not found")
    
    # --- NEW ROBUST CATEGORIZATION LOGIC ---
    # 1. Start with ALL TEAMS and SOLO participants in this event
    all_items = {} # key: team_id or solo_user_id
    total_judges = len(event.get("judges", []))
    
    t_cursor = teams_col.find({"event_id": {"$in": ev_id_variants}})
    async for t in t_cursor:
        tid = str(t["_id"])
        all_items[tid] = {
            "type": "team",
            "team_id": tid,
            "team_name": t.get("name") or t.get("team_name") or "Unnamed Team",
            "score": 0,
            "judges_completed": 0,
            "total_judges": total_judges,
            "is_fully_evaluated": False,
            "status": t.get("institution_selection") or "Pending",
            "assigned_judges": [],
            "source": "team_registry"
        }

    s_cursor = submissions_col.find({
        "event_id": {"$in": ev_id_variants},
        "team_id": {"$exists": False}
    })
    async for s in s_cursor:
        uid = str(s.get("user_id") or "")
        if not uid: continue
        sid = str(s["_id"])
        all_items[f"solo:{uid}"] = {
            "type": "solo",
            "user_id": uid,
            "team_name": s.get("user_name") or s.get("full_name") or "Solo Participant",
            "score": 0,
            "judges_completed": 0,
            "total_judges": total_judges,
            "is_fully_evaluated": False,
            "status": s.get("status") or "Pending",
            "assigned_judges": [],
            "submission_id": sid,
            "source": "solo_registry"
        }

    # 2. Synchronize with Submission Data (Assignments & Recs)
    sd_cursor = submission_data_col.find({"event_id": {"$in": ev_id_variants}})
    async for sd in sd_cursor:
        tid = sd.get("team_id")
        uid = sd.get("user_id")
        key = tid if tid else (f"solo:{uid}" if uid else None)
        if not key or key not in all_items: continue
        
        item = all_items[key]
        item["assigned_judges"] = sd.get("assigned_judges", [])
        item["total_judges"] = len(item["assigned_judges"]) if item["assigned_judges"] else total_judges
        item["submission_id"] = str(sd["_id"])
        
        rec = str(sd.get("evaluation_recommendation") or "").lower()
        if "shortlist" in rec: item["status"] = "Shortlisted"
        elif "reject" in rec: item["status"] = "Rejected"
        elif "approve" in rec or "accept" in rec: item["status"] = "Approved"

    # 3. Apply Real-time Scores
    sc_cursor = scores_col.find({"event_id": {"$in": ev_id_variants}})
    async for sc in sc_cursor:
        tid = sc.get("team_id")
        sid = sc.get("submission_id")
        target = all_items.get(str(tid)) if tid else None
        if not target:
            for it in all_items.values():
                if it.get("submission_id") == str(sid):
                    target = it
                    break
        if target:
            target["score"] = sc.get("total_score") or sc.get("score") or 0
            target["judges_completed"] += 1
            target["is_fully_evaluated"] = target["judges_completed"] >= target["total_judges"]

    # 4. Final Categorization
    shortlisted = []
    approved = []
    rejected = []
    pending = []
    
    for item in all_items.values():
        st = str(item["status"]).lower()
        if "shortlist" in st: shortlisted.append(item)
        elif "approve" in st or "accept" in st: approved.append(item)
        elif "reject" in st: rejected.append(item)
        else: pending.append(item)

    return {
        "summary": {
            "shortlisted": len(shortlisted),
            "approved": len(approved),
            "rejected": len(rejected),
            "pending": len(pending),
        },
        "shortlisted": shortlisted,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
    }

@router.post("/events/{event_id}/bulk-notify")
async def send_bulk_selection_emails(event_id: str, data: dict, user: dict = Depends(get_auth_user)):
    """
    Sends personalized emails to a 'bundle' of selected teams.
    Injects dynamic team names.
    """
    await assert_institution_owns_event(event_id, user)
    team_ids = data.get("team_ids", [])
    next_stage = data.get("next_stage", "Next Round")
    
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    from db import teams_col, users_col, notifications_col
    from datetime import datetime
    
    success_count = 0
    for tid in team_ids:
        # Handle solo participant submissions from bundle
        if str(tid).startswith("sub:"):
            sub_id = str(tid).split(":")[1]
            sub = await submission_data_col.find_one({"_id": ObjectId(sub_id)})
            if sub:
                recipient_email = sub.get("user_email") or sub.get("email")
                if recipient_email:
                    name = sub.get("user_name") or sub.get("team_name") or "Participant"
                    subject = f"Selection Alert: Your project is moving to {next_stage}!"
                    body = get_shortlist_template(name, event.get("title", "the event"), next_stage)
                    asyncio.create_task(send_notification_email(recipient_email, subject, body))
                    
                    # Also create a dynamic in-app notification record
                    user_id_to_notif = sub.get("user_id") or str(sub.get("_id"))
                    asyncio.create_task(notifications_col.insert_one({
                        "user_id": str(user_id_to_notif),
                        "title": subject,
                        "message": f"Congratulations! You've been selected for {next_stage} in {event.get('title')}.",
                        "type": "selection_alert",
                        "is_read": False,
                        "created_at": datetime.utcnow()
                    }))
                    success_count += 1
            continue

        if team:
            # Send to all members of the team
            members = team.get("members", [])
            team_name = team.get("name") or team.get("team_name") or "Your team"
            
            # Check for custom message from admin
            custom_msg = data.get("custom_message") or data.get("message")
            
            # Robust member hydration
            member_emails = []
            for m in members:
                email = m.get("email") if isinstance(m, dict) else m
                if email and "@" in str(email):
                    member_emails.append(email)
                elif isinstance(m, dict) and m.get("user_id"):
                    # Look up user to get email
                    user_rec = await users_col.find_one({"user_id": str(m["user_id"])})
                    if user_rec and user_rec.get("email"):
                        member_emails.append(user_rec["email"])
            
            for member_email in set(member_emails):
                if custom_msg:
                    subject = data.get("subject") or f"Important Update: {event.get('title')}"
                    body = get_announcement_template(team_name, event.get("title", "the event"), custom_msg, next_stage)
                else:
                    subject = f"Selection Alert: {team_name} is moving to {next_stage}!"
                    body = get_shortlist_template(team_name, event.get("title", "the event"), next_stage)
                
                asyncio.create_task(send_notification_email(member_email, subject, body))
                
                # Also create a dynamic in-app notification record for each team member
                # Find member user_id if we have email
                try:
                    m_user = await users_col.find_one({"email": member_email})
                    if m_user:
                        asyncio.create_task(notifications_col.insert_one({
                            "user_id": str(m_user["user_id"]),
                            "title": subject,
                            "message": f"Your team '{team_name}' has been moved to {next_stage} in {event.get('title')}.",
                            "type": "selection_alert" if not custom_msg else "announcement",
                            "is_read": False,
                            "created_at": datetime.utcnow()
                        }))
                except Exception as e:
                    logger.error(f"Failed to create DB notification for {member_email}: {e}")
            
            # Update team status in participants_col if needed
            await participants_col.update_many(
                {"event_id": event_id, "team_id": tid},
                {"$set": {"current_stage": next_stage}}
            )
            success_count += 1
            
    return {"status": "success", "sent_to": success_count}


@router.get("/events/{event_id}/submissions")
async def list_event_submissions_enriched(event_id: str, user: dict = Depends(get_auth_user)):
    """All submissions for an event with team labels, average judge score, and judge assignment emails."""
    await assert_institution_owns_event(event_id, user)
    cursor = submissions_col.find({"event_id": event_id})
    out = []
    async for s in cursor:
        sid = str(s["_id"])
        s["_id"] = sid
        tid = s.get("team_id")
        if tid:
            try:
                team = await teams_col.find_one({"_id": ObjectId(str(tid))})
            except Exception:
                team = None
            if team and not s.get("team_name"):
                s["team_name"] = team.get("name")
        or_sub = [{"submission_id": sid}]
        try:
            or_sub.append({"submission_id": ObjectId(sid)})
        except Exception:
            pass
        sc_cursor = scores_col.find({"$or": or_sub})
        totals = []
        async for sc in sc_cursor:
            totals.append(float(sc.get("total_score") or 0))
        s["total_score"] = round(sum(totals) / len(totals), 1) if totals else float(s.get("score") or 0)
        if "assigned_judge_emails" not in s or s["assigned_judge_emails"] is None:
            s["assigned_judge_emails"] = []
        out.append(s)

    # 2. Merge Hackathon Submissions
    try:
        from db import hackathon_submissions_col, opportunities_col
        # Robust event_id variants
        ev_id_variants = [event_id, str(event_id)]
        try:
            if len(str(event_id)) == 24:
                ev_id_variants.append(ObjectId(event_id))
        except: pass

        linked_opp = await opportunities_col.find_one({"event_link_id": {"$in": ev_id_variants}})
        opp_id_ctx = str(linked_opp["_id"]) if linked_opp else None
        
        hackathon_id_variants = [str(v) for v in ev_id_variants]
        if opp_id_ctx:
            hackathon_id_variants.append(opp_id_ctx)

        h_cursor = hackathon_submissions_col.find({"hackathonId": {"$in": hackathon_id_variants}})
        async for sub in h_cursor:
            sid = str(sub["_id"])
            # Avoid duplicate counting if somehow already there
            if any(str(o.get("_id")) == sid for o in out):
                continue
                
            out.append({
                "_id": sid,
                "event_id": event_id,
                "user_id": sub.get("submittedBy") or sub.get("user_id"),
                "team_name": sub.get("teamName") or sub.get("teamLead") or "Hackathon Team",
                "status": sub.get("status", "Submitted"),
                "submitted_at": sub.get("createdAt").isoformat() if hasattr(sub.get("createdAt"), "isoformat") else sub.get("createdAt"),
                "total_score": sub.get("totalScore", 0.0),
                "source": "hackathon_submission",
                "assigned_judge_emails": [] # Hackathon submissions handle judges differently in their own routes
            })
    except Exception as e:
        logger.error(f"[SUBMISSIONS] Failed to merge hackathon data: {e}")

    return out


@router.patch("/events/{event_id}/teams/{team_id}/selection")
async def update_team_institution_selection(
    event_id: str,
    team_id: str,
    body: dict,
    user: dict = Depends(get_auth_user),
):
    await assert_institution_owns_event(event_id, user)
    st = body.get("status", "Pending")
    
    # Robust event_id variants
    ev_id_variants = [event_id, str(event_id)]
    try:
        if len(str(event_id)) == 24:
            ev_id_variants.append(ObjectId(event_id))
    except:
        pass

    # 1. Try Teams collection
    team = await teams_col.find_one({"_id": ObjectId(team_id), "event_id": {"$in": ev_id_variants}})
    
    if team:
        await teams_col.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {
                "institution_selection": st,
                "institution_selection_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        return {"status": "ok", "team_id": team_id, "institution_selection": st}
        
    # 2. Try Submission Data (for Solo assets)
    sub = await submissions_col.find_one({"_id": ObjectId(team_id), "event_id": {"$in": ev_id_variants}})
    if sub:
        await submissions_col.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {
                "institution_selection": st,
                "institution_selection_at": datetime.now(timezone.utc).isoformat(),
                "evaluation_recommendation": st # Sync with recommendation for bundle visibility
            }}
        )
        return {"status": "ok", "submission_id": team_id, "institution_selection": st}

    raise HTTPException(status_code=404, detail="Candidate (Team or Solo) not found for this event")


@router.patch("/events/{event_id}/submissions/{submission_id}/assign-judges")
async def assign_judges_to_submission_route(
    event_id: str,
    submission_id: str,
    body: dict,
    user: dict = Depends(get_auth_user),
):
    """Restrict which panel judges may score a given submission (emails must exist on the event)."""
    ev = await assert_institution_owns_event(event_id, user)
    sub = await submissions_col.find_one({"_id": ObjectId(submission_id), "event_id": str(event_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found for this event")
    raw = body.get("judge_emails") or body.get("emails") or []
    if isinstance(raw, str):
        raw = [raw]
    emails = [str(e).strip().lower() for e in raw if e]
    judge_pool = {str(j.get("email") or "").strip().lower() for j in (ev.get("judges") or [])}
    invalid = [e for e in emails if e not in judge_pool]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail="These emails are not on the event judge panel: " + ", ".join(invalid),
        )
    await submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "assigned_judge_emails": emails,
                "judge_assignment_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )
    title = ev.get("title") or "Event"
    for em in emails:
        subj = f"Assigned to review a submission — {title}"
        html = f"""<html><body style="font-family:system-ui,sans-serif;color:#111827">
        <p>You were assigned to evaluate a submission for <strong>{title}</strong>.</p>
        <p>Open the Studlyf judge workflow for this event.</p></body></html>"""
        asyncio.create_task(send_notification_email(em, subj, html))
    return {"status": "ok", "assigned_judge_emails": emails}


@router.get("/events/public")
async def get_public_events():
    """PUBLIC: Retrieves live events for student registration."""
    cursor = events_col.find({"status": "Live"})
    events_list = []
    async for event in cursor:
        event["_id"] = str(event["_id"])
        events_list.append(event)
    return events_list

@router.post("/leaderboard/{event_id}/refresh")
async def refresh_leaderboard(event_id: str):
    """Triggers dynamic recalculation of rankings based on latest scores."""
    return await leaderboard_service.calculate_event_leaderboard(event_id)

@router.get("/leaderboard/{event_id}")
async def fetch_leaderboard(event_id: str):
    """Retrieves live event standings based on dynamic judge scoring."""
    if event_id == "active_event":
        # Resolve to latest event
        event = await events_col.find_one({"status": "Live"}, sort=[("created_at", -1)])
        if not event: event = await events_col.find_one({}, sort=[("created_at", -1)])
        if event: event_id = str(event["_id"])

    rankings = await leaderboard_col.find({"event_id": event_id}).sort("rank", 1).to_list(None)
    for r in rankings: r["_id"] = str(r["_id"])
    return rankings

@router.get("/leaderboard/{event_id}/export-pdf")
async def export_leaderboard_pdf(event_id: str):
    """
    Generates a professional PDF report with ranked results 
    and detailed dimension-based breakdowns.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    from db import leaderboard_col, events_col
    
    if event_id == "active_event":
        event = await events_col.find_one({"status": "Live"}, sort=[("created_at", -1)])
        if not event: event = await events_col.find_one({}, sort=[("created_at", -1)])
        if event: event_id = str(event["_id"])

    # 1. Fetch Data
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    rankings = await leaderboard_col.find({"event_id": event_id}).sort("rank", 1).to_list(None)
    
    # 2. Create PDF Buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # 3. Header
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#6C3BFF'),
        spaceAfter=20,
        alignment=1 # Center
    )
    elements.append(Paragraph(f"{event.get('title', 'Event Results')}", title_style))
    elements.append(Paragraph(f"Official Leaderboard & Performance Report", styles['Heading3']))
    elements.append(Spacer(1, 20))
    
    # 4. Table Data
    data = [["Rank", "Team Name", "Score Breakdown", "Final Score"]]
    for r in rankings:
        # Format criteria breakdown as a string
        breakdown_str = ""
        if r.get("criteria_scores"):
            breakdown_str = "\n".join([f"{k}: {v}" for k, v in r["criteria_scores"].items()])
        else:
            breakdown_str = "Verified Overall Score"
        
        data.append([
            f"#{r['rank']}",
            r['team_name'],
            breakdown_str,
            str(r['total_score'])
        ])
    
    # 5. Table Styling
    t = Table(data, colWidths=[50, 150, 200, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6C3BFF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t)
    
    # 6. Build
    doc.build(elements)
    
    # 7. Return PDF
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=results.pdf"}
    )

@router.post("/finalize-event/{event_id}")
async def finalize_event(event_id: str):
    """
    Triggers final results processing and bulk leaderboard generation.
    Transitions event status from LIVE to ENDED.
    """
    from db import scores_col, leaderboard_col, submissions_col
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event: raise HTTPException(status_code=404, detail="Event not found")
    
    # 1. Aggregate scores to calculate rankings
    pipeline = [
        {"$match": {"event_id": event_id}},
        {"$group": {
            "_id": "$submission_id",
            "total_score": {"$avg": {"$add": ["$innovation", "$technicality", "$impact", "$presentation"]}}
        }},
        {"$sort": {"total_score": -1}}
    ]
    
    rankings = await scores_col.aggregate(pipeline).to_list(None)
    
    # 2. Save rankings to Leaderboard
    for idx, rank in enumerate(rankings):
        submission = await submissions_col.find_one({"_id": ObjectId(rank["_id"])})
        leaderboard_entry = {
            "event_id": event_id,
            "team_name": submission.get("team_name", "Unknown"),
            "project_title": submission.get("project_title", "Untitled"),
            "total_score": round(rank["total_score"], 2),
            "rank": idx + 1,
            "finalized_at": datetime.utcnow()
        }
        await leaderboard_col.update_one(
            {"event_id": event_id, "team_name": leaderboard_entry["team_name"]},
            {"$set": leaderboard_entry},
            upsert=True
        )

    # [INTEGRATION ENHANCEMENT]
    from services.leaderboard_service import leaderboard_service
    from db import results_col
    # Resolving undefined variable 'final_rankings' from original code by using the dynamic service
    final_rankings = await leaderboard_service.calculate_event_leaderboard(event_id)
    winner_ids = [r.get("team_id") or r.get("participant_id") for r in final_rankings[:3]]
    await results_col.update_one({"event_id": event_id}, {"$set": {"winner_ids": winner_ids, "final_rankings": final_rankings}}, upsert=True)

    # 3. Mark event as ended
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"status": "ENDED", "finalized_at": datetime.utcnow()}}
    )

    # 4. Generate Certificates for Winners
    await generate_event_certificates(event_id, final_rankings)

    await log_admin_action("admin@institution.com", "EVENT_FINALIZED", f"Finalized event {event_id} and generated certificates.")
    return {"status": "success", "results": final_rankings}

async def generate_event_certificates(event_id: str, rankings: list):
    """Generates individual certificates for all members of the top teams."""
    from db import certificates_col, teams_col, events_col
    import uuid
    
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    event_type = event.get("event_type", "Hackathon")
    
    cert_entries = []
    for rank_data in rankings:
        # Fetch the team to get all member names
        team = await teams_col.find_one({"team_name": rank_data["team_name"], "event_id": event_id})
        members = team.get("members", []) if team else [{"full_name": rank_data["team_name"]}]
        
        for member in members:
            cert_entries.append({
                "certificate_id": str(uuid.uuid4()),
                "verification_code": uuid.uuid4().hex[:12].upper(),
                "event_id": event_id,
                "event_title": event.get("title"),
                "event_type": event_type,
                "recipient_name": member.get("full_name", "Participant"),
                "team_name": rank_data["team_name"],
                "rank": rank_data["rank"] if event_type in ["Hackathon", "Competition"] else None,
                "category": "Winner" if rank_data["rank"] <= 3 else "Participant",
                "issued_date": datetime.utcnow().isoformat(),
                "verification_url": f"/verify/cert/{uuid.uuid4().hex[:10]}",
                "status": "ISSUED"
            })
    
    if cert_entries:
        await certificates_col.insert_many(cert_entries)
        
        # [REAL-TIME NOTIFICATION] Notify Recipients via Email
        for cert in cert_entries:
            # We need the recipient's email. Since it's not in the cert_entry, 
            # we try to find it from the user's record or use a fallback.
            recipient_email = None
            # Heuristic: try to find user by name or look up in participants
            participant = await participants_col.find_one({"full_name": cert["recipient_name"], "event_id": event_id})
            if participant:
                recipient_email = participant.get("email")
            
            if recipient_email:
                subject = f"Congratulations! Your Certificate for {cert['event_title']} is ready"
                body = get_certificate_template(
                    user_name=cert['recipient_name'],
                    event_name=cert['event_title'],
                    rank=str(cert.get('rank')) if cert.get('rank') else None,
                    category=cert.get('category', 'Participant')
                )
                asyncio.create_task(send_notification_email(recipient_email, subject, body))
    
    return {"status": "Event finalized and leaderboard generated successfully"}

@router.get("/export-summary/{institution_id}")
async def export_institution_summary_csv(institution_id: str, user: dict = Depends(get_auth_user)):
    """Generates a CSV export of the institutional performance summary."""
    assert_institution_scope(institution_id, user)
    import csv
    import io
    from fastapi.responses import StreamingResponse
    from services.institutional_analytics_service import analytics_service
    
    data = await analytics_service.get_kpi_summary(institution_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])
    for key, value in data.items():
        writer.writerow([key.replace('_', ' ').title(), value])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=institution_report_{institution_id}.csv"}
    )

@router.get("/verify-certificate/{certificate_id}")
async def verify_certificate(certificate_id: str):
    """
    PUBLIC ENDPOINT: Validates a certificate and returns its details.
    Used by the public verification page.
    """
    cert = await certificates_col.find_one({"certificate_id": certificate_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid.")
    
    # Return professional snapshot
    return {
        "recipient": cert.get("recipient_name"),
        "event": "Competition Achievement", # Ideally fetch from event_id
        "rank": cert.get("rank"),
        "issued_date": cert.get("issued_at"),
        "status": "VALIDATED",
        "institution": "Certified Institution Network"
    }

@router.options("/notifications/{institution_id}")
async def options_notifications(institution_id: str):
    """Handle CORS preflight for notifications endpoint."""
    return {"status": "ok"}

@router.get("/notifications/{institution_id}")
async def get_notifications(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves real-time institutional activity alerts from persistent storage."""
    assert_institution_scope(institution_id, user)
    try:
        # Fetch latest 10 unread notifications
        cursor = notifications_col.find({
            "institution_id": institution_id,
            "is_read": {"$ne": True}
        }).sort("created_at", -1).limit(10)
        
        notifs = []
        async for n in cursor:
            n["_id"] = str(n["_id"])
            notifs.append(n)
        return notifs
    except Exception as e:
        logger.error(f"[NOTIF ERROR] {str(e)}")
        return []


@router.get("/notifications/me")
async def get_my_institution_notifications(user: dict = Depends(get_auth_user)):
    """Fallback-safe notification fetch for institution users without client-side institution_id."""
    institution_id = str(user.get("institution_id") or "").strip()
    if not institution_id:
        # Resolve and persist missing institution scope for older users.
        inst = None
        try:
            if user.get("institution_name"):
                inst = await institutions_col.find_one({"name": user.get("institution_name")})
            if not inst:
                inst = await institutions_col.find_one({"admin_email": str(user.get("email") or "").strip().lower()})
            if inst:
                institution_id = str(inst.get("_id") or "")
                await users_col.update_one(
                    {"user_id": str(user.get("user_id") or "")},
                    {"$set": {"institution_id": institution_id}},
                )
        except Exception:
            institution_id = ""
    if not institution_id:
        return []
    try:
        cursor = notifications_col.find(
            {"institution_id": institution_id, "is_read": {"$ne": True}}
        ).sort("created_at", -1).limit(10)
        notifs = []
        async for n in cursor:
            n["_id"] = str(n["_id"])
            notifs.append(n)
        return notifs
    except Exception as e:
        logger.error(f"[NOTIF ERROR] {str(e)}")
        return []

@router.post("/notifications/{institution_id}/mark-read")
async def mark_notifications_read(institution_id: str, user: dict = Depends(get_auth_user)):
    """Permanently marks all unread notifications for an institution as read in DB."""
    assert_institution_scope(institution_id, user)
    try:
        await notifications_col.update_many(
            {"institution_id": institution_id, "is_read": {"$ne": True}},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": "success", "message": "All notifications marked as read"}
    except Exception as e:
        logger.error(f"[NOTIF ERROR] Mark read failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notifications")


@router.post("/notifications/me/mark-read")
async def mark_my_notifications_read(user: dict = Depends(get_auth_user)):
    """Fallback-safe notification mark-read for institution users without client institution_id."""
    institution_id = str(user.get("institution_id") or "").strip()
    if not institution_id:
        inst = None
        try:
            if user.get("institution_name"):
                inst = await institutions_col.find_one({"name": user.get("institution_name")})
            if not inst:
                inst = await institutions_col.find_one({"admin_email": str(user.get("email") or "").strip().lower()})
            institution_id = str((inst or {}).get("_id") or "")
        except Exception:
            institution_id = ""
    if not institution_id:
        return {"status": "success", "message": "No institution scope found"}
    try:
        await notifications_col.update_many(
            {"institution_id": institution_id, "is_read": {"$ne": True}},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": "success", "message": "All notifications marked as read"}
    except Exception as e:
        logger.error(f"[NOTIF ERROR] Mark read failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notifications")

@router.get("/submissions/all-deliverables")
async def get_all_deliverables(institution_id: str, user: dict = Depends(get_auth_user)):
    """
    Global fetch for all phase-specific deliverables across all events of an institution.
    Used for the 'Phase Deliverables' tab in the global command center.
    """
    assert_institution_scope(institution_id, user)
    
    inst_variants = [institution_id, str(institution_id)]
    try:
        if len(str(institution_id)) == 24:
            inst_variants.append(ObjectId(institution_id))
    except:
        pass

    # 1. Get all events for this institution to scope the search
    events = await events_col.find({"institution_id": {"$in": inst_variants}}).to_list(length=None)
    event_ids = [str(e["_id"]) for e in events]
    event_titles = {str(e["_id"]): (e.get("title") or e.get("name") or "Event") for e in events}
    
    # 2. Fetch all teams/submissions to get global status
    teams = await teams_col.find({"event_id": {"$in": event_ids}}).to_list(length=None)
    team_status_map = {str(t["_id"]): t.get("institution_selection") or t.get("status") for t in teams}
    
    submissions = await submissions_col.find({"event_id": {"$in": event_ids}}).to_list(length=None)
    sub_status_map = {str(s["user_id"]): s.get("status") for s in submissions if s.get("user_id")}

    # 3. Fetch all submission_data (deliverables) for these events
    cursor = submission_data_col.find({"event_id": {"$in": event_ids}})
    deliverables = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        eid = str(doc.get("event_id") or "")
        doc["event_title"] = event_titles.get(eid, "Unknown Event")
        
        # Cross-reference global status
        tid = str(doc.get("team_id") or "")
        uid = str(doc.get("user_id") or "")
        
        global_status = team_status_map.get(tid) or sub_status_map.get(uid) or doc.get("status") or "Received"
        doc["status"] = global_status
        
        # Ensure name consistency for frontend
        doc["team_name"] = doc.get("team_name") or doc.get("user_name") or doc.get("title") or "Participant"
        deliverables.append(doc)
        
    return deliverables

@router.get("/submissions/{institution_id}")
async def get_all_submissions(institution_id: str, user: dict = Depends(get_auth_user)):
    """
    Retrieves all project bundles filtered by institution, categorized by lifecycle status.
    Parity with get_qualified_bundle for global institutional visibility.
    """
    assert_institution_scope(institution_id, user)
    
    inst_variants = [institution_id, str(institution_id)]
    try:
        if len(str(institution_id)) == 24:
            inst_variants.append(ObjectId(institution_id))
    except:
        pass

    # 1. Get all events
    events = await events_col.find({"institution_id": {"$in": inst_variants}}).to_list(length=None)
    event_ids = [str(e["_id"]) for e in events]
    event_titles = {str(e["_id"]): (e.get("title") or e.get("name") or "Event") for e in events}
    event_judges = {str(e["_id"]): len(e.get("judges") or []) for e in events}

    # 2. Aggregate all teams and solo submissions
    all_items = {} # key: team_id or solo:user_id
    
    # Fetch Teams
    t_cursor = teams_col.find({"event_id": {"$in": event_ids}})
    async for t in t_cursor:
        tid = str(t["_id"])
        eid = str(t.get("event_id") or "")
        all_items[tid] = {
            "type": "team",
            "team_id": tid,
            "team_name": t.get("name") or t.get("team_name") or "Unnamed Team",
            "project_title": t.get("project_title") or t.get("name") or "Project",
            "event_id": eid,
            "event_title": event_titles.get(eid, "Unknown Event"),
            "score": 0,
            "judges_completed": 0,
            "total_judges": event_judges.get(eid, 0),
            "status": t.get("institution_selection") or "Pending",
            "assigned_judges": [],
            "source": "team_registry"
        }

    # Fetch Solo Submissions
    s_cursor = submissions_col.find({
        "event_id": {"$in": event_ids},
        "team_id": {"$exists": False}
    })
    async for s in s_cursor:
        uid = str(s.get("user_id") or "")
        if not uid: continue
        sid = str(s["_id"])
        eid = str(s.get("event_id") or "")
        all_items[f"solo:{uid}"] = {
            "type": "solo",
            "user_id": uid,
            "team_name": s.get("user_name") or s.get("full_name") or "Solo Participant",
            "project_title": s.get("project_title") or "Project",
            "event_id": eid,
            "event_title": event_titles.get(eid, "Unknown Event"),
            "score": 0,
            "judges_completed": 0,
            "total_judges": event_judges.get(eid, 0),
            "status": s.get("status") or "Pending",
            "assigned_judges": [],
            "submission_id": sid,
            "source": "solo_registry"
        }

    # 3. Sync with Submission Data
    sd_cursor = submission_data_col.find({"event_id": {"$in": event_ids}})
    async for sd in sd_cursor:
        tid = sd.get("team_id")
        uid = sd.get("user_id")
        key = tid if tid else (f"solo:{uid}" if uid else None)
        if not key or key not in all_items: continue
        
        item = all_items[key]
        item["assigned_judges"] = sd.get("assigned_judges", [])
        # Update total judges based on actual assignment if available
        if item["assigned_judges"]:
            item["total_judges"] = len(item["assigned_judges"])
            
        item["submission_id"] = str(sd["_id"])
        item["project_description"] = sd.get("project_description") or sd.get("description", "")
        
        rec = str(sd.get("evaluation_recommendation") or "").lower()
        if "shortlist" in rec: item["status"] = "Shortlisted"
        elif "reject" in rec: item["status"] = "Rejected"
        elif "approve" in rec or "accept" in rec: item["status"] = "Approved"

    # 4. Sync Scores
    sc_cursor = scores_col.find({"event_id": {"$in": event_ids}})
    async for sc in sc_cursor:
        tid = sc.get("team_id")
        sid = sc.get("submission_id")
        target = all_items.get(str(tid)) if tid else None
        if not target:
            for it in all_items.values():
                if it.get("submission_id") == str(sid):
                    target = it
                    break
        if target:
            # Aggregate or take latest score
            target["score"] = sc.get("total_score") or sc.get("score") or target["score"]
            target["judges_completed"] += 1

    # 5. Categorization
    shortlisted = []
    approved = []
    rejected = []
    pending = []
    
    for item in all_items.values():
        st = str(item["status"]).lower()
        if "shortlist" in st: shortlisted.append(item)
        elif "approve" in st or "accept" in st: approved.append(item)
        elif "reject" in st: rejected.append(item)
        else: pending.append(item)

    return {
        "summary": {
            "shortlisted": len(shortlisted),
            "approved": len(approved),
            "rejected": len(rejected),
            "pending": len(pending),
            "total": len(all_items)
        },
        "shortlisted": shortlisted,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "all": list(all_items.values())
    }

@router.post("/submissions")
async def create_submission(submission_data: dict):
    """
    Creates a new project submission record.
    Fulfills Nithya's core backend responsibility.
    """
    from db import submissions_col
    from datetime import datetime
    
    # 1. Prevent Duplicates (Search by team_name and event_id)
    team_name = submission_data.get("team_name")
    event_id = submission_data.get("event_id")
    
    if team_name and event_id:
        query = {"team_name": team_name, "event_id": event_id}
        # If it's a manual entry without specific user_id, we just update the record
        submission_data["updated_at"] = datetime.utcnow()
        await submissions_col.update_one(
            query,
            {"$set": submission_data},
            upsert=True
        )
        return {"status": "success", "message": "Submission recorded (updated if existed)"}
    
    # Fallback for legacy or partial data
    submission_data["submitted_at"] = datetime.utcnow()
    result = await submissions_col.insert_one(submission_data)
    
    # Notify Institution
    try:
        inst_id = str(user.get("institution_id") or "").strip()
        if inst_id:
            asyncio.create_task(notify_institution(
                institution_id=inst_id,
                title="New Submission",
                message=f"A new project submission has been received for {submission_data.get('event_title', 'an event')}.",
                ntype="success"
            ))
    except Exception as ne:
        pass
    
    # [REAL-TIME NOTIFICATION] Notify Institution
    inst_id = submission_data.get("institution_id")
    if inst_id:
        institution = await institutions_col.find_one({"institution_id": inst_id})
        if institution:
            notif_settings = institution.get("notifications", {})
            admin_alerts = notif_settings.get("admin_alerts", {})
            if admin_alerts.get("new_submissions", False):
                inst_email = institution.get("email")
                if inst_email:
                    event = await events_col.find_one({"_id": ObjectId(submission_data.get("event_id"))})
                    event_title = event.get("title", "Event") if event else "Event"
                    
                    inst_subject = f"New Submission: {event_title}"
                    inst_body = f"""
                    <html>
                        <body style="font-family: Arial, sans-serif; color: #333;">
                            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                                <h2 style="color: #10B981;">New Project Submitted!</h2>
                                <p>Hello Admin,</p>
                                <p>A team has just submitted their project for <strong>{event_title}</strong>.</p>
                                <p><strong>Team Name:</strong> {submission_data.get('team_name', 'N/A')}</p>
                                <p><strong>Project Title:</strong> {submission_data.get('project_title', 'N/A')}</p>
                                <br>
                                <p>You can review the submission in your dashboard.</p>
                                <br>
                                <p>Best Regards,<br>Studlyf Institution Network</p>
                            </div>
                        </body>
                    </html>
                    """
                    asyncio.create_task(send_notification_email(inst_email, inst_subject, inst_body))

    return {"status": "success", "id": str(result.inserted_id)}

@router.get("/judge/assigned/{judge_id}")
async def get_assigned_projects(
    judge_id: str,
    event_id: Optional[str] = Query(None),
    user: dict = Depends(get_auth_user),
):
    """Submissions the logged-in user may judge (path segment is legacy; identity comes from JWT email)."""
    return await _list_submissions_for_judge_user(user, event_id)


@router.get("/judge/my-assignments")
async def judge_my_assignments(
    event_id: Optional[str] = Query(None),
    user: dict = Depends(get_auth_user),
):
    """Explicit alias for assignment list (authenticated)."""
    return await _list_submissions_for_judge_user(user, event_id)


@router.post("/judge/respond-invitation")
async def judge_respond_invitation(body: dict, user: dict = Depends(get_auth_user)):
    """Judge accepts or declines an event invitation (matched by account email). Creates an institution navbar notification."""
    event_id = body.get("event_id")
    if not event_id:
        raise HTTPException(status_code=400, detail="event_id is required")
    accept = bool(body.get("accept", True))
    email = (user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Account email required")
    event = await events_col.find_one({"_id": ObjectId(str(event_id))})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    judges = list(event.get("judges") or [])
    found = False
    judge_name = email
    for i, j in enumerate(judges):
        je = str(j.get("email") or "").strip().lower()
        if je == email:
            found = True
            judge_name = j.get("name") or email
            judges[i] = {
                **j,
                "status": "ACCEPTED" if accept else "DECLINED",
                "responded_at": datetime.now(timezone.utc).isoformat(),
            }
            break
    if not found:
        raise HTTPException(status_code=404, detail="No invitation found for your email on this event")
    await events_col.update_one({"_id": ObjectId(str(event_id))}, {"$set": {"judges": judges}})
    inst_id = event.get("institution_id")
    title = event.get("title") or "Event"
    if inst_id:
        msg = (
            f"Judge {judge_name} ({email}) accepted the invitation for \"{title}\"."
            if accept
            else f"Judge {judge_name} ({email}) declined the invitation for \"{title}\"."
        )
        await notify_institution(
            str(inst_id),
            msg,
            ntype="judge_invitation_response",
            title="Judge invitation update",
            meta={"event_id": str(event_id), "accept": accept, "judge_email": email},
        )
    return {"status": "success", "accept": accept}


@router.post("/judge/score")
async def save_judge_score(score_data: dict, user: dict = Depends(get_auth_user)):
    """
    Saves a judge's evaluation with support for multiple criteria 
    (Innovation, UI, etc.) and auto-calculates total.
    """
    from db import scores_col, submissions_col, teams_col
    from datetime import datetime

    ue = (user.get("email") or "").strip().lower()
    if not ue:
        raise HTTPException(status_code=400, detail="Account email required for scoring")
    criteria_scores = score_data.get("criteria_scores") or score_data.get("scores") or {}
    if isinstance(criteria_scores, dict):
        try:
            criteria_scores = {k: float(v) for k, v in criteria_scores.items()}
        except (TypeError, ValueError):
            criteria_scores = {}
    total_score = sum(criteria_scores.values()) if criteria_scores else float(score_data.get("total_score", 0))

    submission_id = score_data.get("submission_id")
    event_id = score_data.get("event_id")
    team_id = score_data.get("team_id")
    if not submission_id or not event_id:
        raise HTTPException(status_code=400, detail="submission_id and event_id are required")

    sub = await submissions_col.find_one({"_id": ObjectId(str(submission_id))})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not team_id and sub.get("team_id"):
        team_id = str(sub["team_id"])
    assigned = sub.get("assigned_judge_emails") or []
    if assigned:
        norm = {str(a).strip().lower() for a in assigned if a}
        if ue not in norm:
            raise HTTPException(status_code=403, detail="You are not assigned to review this submission")

    je = (score_data.get("judge_email") or "").strip().lower()
    if je and je != ue:
        raise HTTPException(status_code=403, detail="judge_email must match the authenticated account")

    evaluation_entry = {
        "event_id": event_id,
        "team_id": team_id,
        "submission_id": submission_id,
        "judge_email": ue,
        "criteria_scores": criteria_scores,
        "total_score": total_score,
        "feedback": score_data.get("feedback") or score_data.get("comments") or "",
        "evaluated_at": datetime.utcnow(),
    }

    await scores_col.insert_one(evaluation_entry)

    await submissions_col.update_one(
        {"_id": ObjectId(str(submission_id))},
        {"$set": {"status": "Scored"}},
    )

    event = await events_col.find_one({"_id": ObjectId(str(event_id))})
    if event:
        inst_id = event.get("institution_id")
        team_name = "a team"
        if team_id:
            team = await teams_col.find_one({"_id": ObjectId(str(team_id))})
            if team:
                team_name = team.get("name") or team_name
        if inst_id:
            await notify_institution(
                str(inst_id),
                f"Judge {ue} submitted a score ({total_score}/100) for {team_name} on \"{event.get('title', 'event')}\".",
                ntype="judge_scored",
                title="Submission scored",
                meta={"event_id": str(event_id), "submission_id": str(submission_id), "judge_email": ue},
            )
        institution = await institutions_col.find_one({"institution_id": event["institution_id"]})
        if institution:
            notif_settings = institution.get("notifications", {}).get("admin_alerts", {})
            if notif_settings.get("judge_evaluations", True):
                inst_email = institution.get("email")
                if inst_email:
                    subject = f"Judge Action: {team_name} Scored ({total_score}/100)"
                    body = f"""
                    <html>
                        <body style="font-family: Arial, sans-serif; color: #333;">
                            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
                                <h2 style="color: #6C3BFF;">Evaluation Complete</h2>
                                <p>Hello Admin,</p>
                                <p>A judge has finished evaluating <strong>{team_name}</strong> for the event: <strong>{event['title']}</strong>.</p>
                                <div style="background: #f8f9ff; padding: 15px; border-radius: 10px; border-left: 4px solid #6C3BFF;">
                                    <p style="margin: 0;"><strong>Final Score:</strong> {total_score} / 100</p>
                                </div>
                                <br>
                                <p>The team has been updated in your <strong>Selection Command Center</strong>.</p>
                                <br>
                                <p>Best Regards,<br>Studlyf Evaluation Network</p>
                            </div>
                        </body>
                    </html>
                    """
                    asyncio.create_task(send_notification_email(inst_email, subject, body))

    await log_admin_action(ue, "SUBMISSION_SCORED", f"Scored team {team_id}")
    return {"status": "success", "total_score": total_score}

@router.get("/analytics/{institution_id}/timeline")
async def get_analytics_timeline(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves the 30-day registration timeline for a specific institution."""
    assert_institution_scope(institution_id, user)
    return await analytics_service.get_registration_timeline(institution_id)

@router.get("/analytics/{institution_id}/departments")
async def get_analytics_departments(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves the departmental participation breakdown."""
    assert_institution_scope(institution_id, user)
    return await analytics_service.get_departmental_breakdown(institution_id)

@router.get("/analytics/{institution_id}/score-distribution")
async def get_score_distribution(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves score frequency distribution from real data."""
    assert_institution_scope(institution_id, user)
    from db import scores_col, submissions_col
    
    # Simple aggregation to count scores in buckets
    pipeline = [
        # Match scores for submissions belonging to this institution
        {"$lookup": {
            "from": "submissions",
            "localField": "submission_id",
            "foreignField": "_id",
            "as": "submission"
        }},
        {"$unwind": "$submission"},
        {"$match": {"submission.institution_id": institution_id}},
        {"$project": {
            "bucket": {
                "$switch": {
                    "branches": [
                        {"case": {"$lte": ["$total_score", 20]}, "then": "0-20"},
                        {"case": {"$lte": ["$total_score", 40]}, "then": "21-40"},
                        {"case": {"$lte": ["$total_score", 60]}, "then": "41-60"},
                        {"case": {"$lte": ["$total_score", 80]}, "then": "61-80"}
                    ],
                    "default": "81-100"
                }
            }
        }},
        {"$group": {"_id": "$bucket", "count": {"$sum": 1}}},
        {"$project": {"range": "$_id", "count": 1, "_id": 0}}
    ]
    
    results = await scores_col.aggregate(pipeline).to_list(None)
    
    # Ensure all ranges are present even if count is 0
    ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"]
    final_results = []
    for r in ranges:
        match = next((item for item in results if item["range"] == r), None)
        final_results.append(match if match else {"range": r, "count": 0})
        
    return final_results

@router.get("/analytics/{institution_id}/submission-distribution")
async def get_submission_distribution(institution_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves submissions per event from real data."""
    assert_institution_scope(institution_id, user)
    from db import submissions_col
    
    pipeline = [
        {"$match": {"institution_id": institution_id}},
        {"$lookup": {
            "from": "events",
            "localField": "event_id",
            "foreignField": "_id",
            "as": "event_info"
        }},
        {"$unwind": "$event_info"},
        {"$group": {"_id": "$event_info.title", "count": {"$sum": 1}}},
        {"$project": {"event": "$_id", "count": 1, "_id": 0}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    
    return await submissions_col.aggregate(pipeline).to_list(None)

@router.get("/export-summary/{institution_id}")
async def export_institution_summary(institution_id: str, user: dict = Depends(get_auth_user)):
    """Generates and returns an executive summary report for the institution."""
    assert_institution_scope(institution_id, user)
    return {"message": "Export feature coming soon", "institution_id": institution_id}

@router.patch("/submissions/{submission_id}/status")
async def update_submission_status(submission_id: str, status_update: dict, user: dict = Depends(get_auth_user)):
    """Updates the review status and records internal processing notes (PRs, Venue, etc)."""
    from db import submissions_col
    sub = await submissions_col.find_one({"_id": ObjectId(submission_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    eid = str(sub.get("event_id") or "")
    if eid:
        await assert_institution_owns_event(eid, user)
    else:
        assert_institution_scope(str(sub.get("institution_id") or ""), user)
    update_fields = {
        "status": status_update["status"],
        "internal_notes": status_update.get("notes", status_update.get("internal_notes", "")),
        "pr_links": status_update.get("pr_links", []),
        "processed_at": datetime.utcnow().isoformat()
    }
    await submissions_col.update_one({"_id": ObjectId(submission_id)}, {"$set": update_fields})
    await log_admin_action("admin@institution.com", "SUBMISSION_PROCESSED", f"Processed submission {submission_id} with status {status_update['status']}")
    return {"status": "success"}

@router.patch("/events/{event_id}/teams/{team_id}/status")
async def update_team_status(event_id: str, team_id: str, status_update: dict, user: dict = Depends(get_auth_user)):
    """Updates the status of a team in an institution event."""
    await assert_institution_owns_event(event_id, user)
    from db import participants_col, teams_col
    
    # Update participants with this team_id
    result = await participants_col.update_many(
        {"event_id": event_id, "team_id": team_id},
        {"$set": {"status": status_update["status"]}}
    )
    
    # Also update the team status if teams collection exists
    try:
        await teams_col.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"status": status_update["status"]}}
        )
    except Exception:
        pass  # Team might not exist or update might fail
    
    # Also notify team members dynamically
    try:
        from db import notifications_col
        from datetime import datetime
        team_doc = await teams_col.find_one({"_id": ObjectId(team_id)})
        event_doc = await events_col.find_one({"_id": ObjectId(event_id)})
        if team_doc and event_doc:
            members = team_doc.get("members", [])
            for m in members:
                m_uid = m.get("user_id")
                if m_uid:
                    asyncio.create_task(notifications_col.insert_one({
                        "user_id": str(m_uid),
                        "title": f"Status Update: {event_doc.get('title')}",
                        "message": f"Your team '{team_doc.get('name')}' status has been updated to '{status_update['status']}'.",
                        "type": "selection_alert",
                        "is_read": False,
                        "created_at": datetime.utcnow()
                    }))
    except Exception as e:
        logger.error(f"Failed to create manual team notification: {e}")

    return {"status": "success", "updated_count": result.modified_count}

@router.post("/events/{event_id}/send-status-email")
async def send_status_email(event_id: str, email_data: dict, user: dict = Depends(get_auth_user)):
    """Sends status update email to team members."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col, participants_col
    
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    team_name = email_data.get("team_name", "Team")
    status = email_data.get("status", "Updated")
    team_id = email_data.get("team_id")
    emails = email_data.get("emails", [])
    
    print(f"[EMAIL DEBUG] Team ID: {team_id}, Status: {status}, Provided emails: {emails}")
    
    # If no emails provided, try to fetch from participants collection
    if not emails and team_id:
        participants = await participants_col.find({
            "event_id": event_id,
            "team_id": team_id
        }).to_list(None)
        emails = [p.get("email") for p in participants if p.get("email")]
        print(f"[EMAIL DEBUG] Fetched {len(emails)} emails from participants: {emails}")
    
    if not emails:
        print(f"[EMAIL DEBUG] No email addresses found for team {team_id}")
        return {"status": "no_emails", "message": "No email addresses provided", "emails_found": emails}
    
    # Stage context from frontend
    stage_context = email_data.get("stage_context", {})
    stage_number = stage_context.get("stage_number", 1)
    total_stages = stage_context.get("total_stages", 1)
    stage_name = stage_context.get("stage_name", "")
    next_stage_name = stage_context.get("next_stage_name", "")
    is_final_stage = stage_context.get("is_final_stage", False)
    
    # Build dynamic messages using actual stage names from event data
    if is_final_stage:
        # Final stage messages - mention "Winner" or "Finalist"
        status_messages = {
            "Approved": f"Congratulations! Your team has been selected as a WINNER of {event.get('title', 'the event')}! You excelled in the final {stage_name}. Well done!",
            "Rejected": f"We regret to inform you that your team has not been selected for the final {stage_name} of {event.get('title', 'the event')}. We appreciate your participation throughout the competition.",
            "Shortlisted": f"Great news! Your team has been shortlisted for the final {stage_name} of {event.get('title', 'the event')}. The final results will be announced soon!",
            "Winner": f"Congratulations! Your team has been declared a WINNER of {event.get('title', 'the event')}! You excelled in the final {stage_name}. Well done!"
        }
        subject = f"Final Round Result - {event.get('title', 'Event')}"
    else:
        # Regular stage messages - use actual stage names from frontend
        if total_stages > 1:
            # Multi-stage event - mention the actual next stage name for approvals
            next_stage_display = next_stage_name if next_stage_name else f"Round {stage_number + 1}"
            current_stage_display = stage_name if stage_name else f"Round {stage_number}"
            
            status_messages = {
                "Approved": f"Congratulations! Your team has been selected and approved to advance to {next_stage_display}. Keep up the great work!",
                "Rejected": f"We regret to inform you that your team has not been selected for {current_stage_display}. We encourage you to participate in future events.",
                "Shortlisted": f"Great news! Your team has been shortlisted for {current_stage_display}. We will notify you of the final decision soon.",
                "Winner": f"Congratulations! Your team has been declared a WINNER of {event.get('title', 'the event')}!"
            }
            subject = f"{current_stage_display} Result - {event.get('title', 'Event')}"
        else:
            # Single stage event
            status_messages = {
                "Approved": "Congratulations! Your team has been selected and approved.",
                "Rejected": "We regret to inform you that your team has not been selected.",
                "Shortlisted": "Great news! Your team has been shortlisted for further consideration.",
                "Winner": f"Congratulations! Your team has been declared a WINNER of {event.get('title', 'the event')}!"
            }
            subject = f"Application Status Update - {event.get('title', 'Event')}"
    
    message = status_messages.get(status, f"Your team status has been updated to: {status}")
    
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #6C3BFF; margin-top: 0;">{subject}</h2>
            <p style="font-size: 16px; color: #333;">Dear Team,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">{message}</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">This is an automated message regarding your application for <strong>{event.get('title', 'the event')}</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Best regards,</p>
            <p style="font-size: 14px; color: #333; font-weight: bold; margin-top: 0;">{event.get('title', 'Event Team')}</p>
        </div>
    </div>
    """
    
    # Send emails to all team members
    from services.email_service import send_notification_email
    sent_count = 0
    for email in emails:
        try:
            print(f"[EMAIL DEBUG] Attempting to send email to {email}")
            result = await send_notification_email(email, subject, body_html)
            print(f"[EMAIL DEBUG] Email sent to {email}, result: {result}")
            sent_count += 1
        except Exception as e:
            print(f"[EMAIL DEBUG] Failed to send email to {email}: {e}")
    
    print(f"[EMAIL DEBUG] Email sending complete. Sent: {sent_count}/{len(emails)}")
    return {"status": "success", "sent_count": sent_count, "total_emails": len(emails)}

@router.patch("/participants/{participant_id}/verify")
async def verify_internal_process(participant_id: str, verification_data: dict):
    """Handles internal verification: Payment (NIT) and Venue Assignment (SIRT)."""
    from db import participants_col
    update_fields = {
        "payment_verified": verification_data.get("payment_verified", False),
        "venue_assignment": verification_data.get("venue_assignment", "N/A"),
        "is_eligible": verification_data.get("is_eligible", True)
    }
    await participants_col.update_one({"_id": ObjectId(participant_id)}, {"$set": update_fields})
    return {"status": "success"}

@router.get("/events/{event_id}/details")
async def get_complex_event_details(event_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves full event details including stages, fees, and rules."""
    ev = await assert_institution_owns_event(event_id, user)
    # Re-use the already-fetched event doc from the auth check
    event = dict(ev)
    event["_id"] = str(event["_id"])
    # Ensure stages is always a list
    if "stages" not in event or event["stages"] is None:
        event["stages"] = []
    # Ensure each stage has a stable id (persist back to DB so UI edits/delete are correct)
    if isinstance(event.get("stages"), list):
        mutated = False
        for s in event["stages"]:
            if isinstance(s, dict) and not s.get("id"):
                s["id"] = str(uuid.uuid4())
                mutated = True
        if mutated:
            await events_col.update_one(_event_id_query(event_id), {"$set": {"stages": event["stages"]}})
    return event

@router.patch("/events/{event_id}")
async def update_event_details(event_id: str, update_data: dict, user: dict = Depends(get_auth_user)):
    """Updates general event information."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col
    if "_id" in update_data: del update_data["_id"]
    # Normalize stages: ensure stable ids are persisted.
    if isinstance(update_data.get("stages"), list):
        for s in update_data["stages"]:
            if isinstance(s, dict) and not s.get("id"):
                s["id"] = str(uuid.uuid4())
            
            # Synchronize registration deadline from stages
            if isinstance(s, dict) and str(s.get("type", "")).upper() == "REGISTRATION":
                reg_end = s.get("end_date") or s.get("endDate") or s.get("deadline")
                if reg_end:
                    update_data["registrationDeadline"] = reg_end

    await events_col.update_one(_event_id_query(event_id), {"$set": update_data})
    
    # Synchronize with linked opportunity portal
    try:
        from db import opportunities_col
        opp_update = {}
        if "stages" in update_data:
            opp_update["stages"] = update_data["stages"]
        if "registrationDeadline" in update_data:
            opp_update["deadline"] = update_data["registrationDeadline"]
        if "title" in update_data:
            opp_update["title"] = update_data["title"]
        if "description" in update_data:
            opp_update["description"] = update_data["description"]
            
        if opp_update:
            await opportunities_col.update_many({"event_link_id": str(event_id)}, {"$set": opp_update})
    except Exception as e:
        print(f"[ERROR] Failed to sync opportunity: {e}")

    return {"status": "success"}

@router.post("/events/{event_id}/upload-media")
async def upload_event_media(
    event_id: str,
    file: UploadFile = File(...),
    field: str = Form(...),
    user: dict = Depends(get_auth_user)
):
    """Uploads a logo or banner image for an existing event and updates its record."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col, opportunities_col

    if field not in ("logo_url", "banner_url"):
        raise HTTPException(status_code=400, detail="field must be 'logo_url' or 'banner_url'")

    ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    EVENTS_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "events")
    os.makedirs(EVENTS_UPLOAD_DIR, exist_ok=True)

    prefix = "logo" if field == "logo_url" else "banner"
    fname = f"{prefix}_{uuid.uuid4()}{ext}"
    fpath = os.path.join(EVENTS_UPLOAD_DIR, fname)
    content = await file.read()
    with open(fpath, "wb") as f:
        f.write(content)

    BASE_URL = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000")
    url = f"{BASE_URL}/uploads/events/{fname}"

    await events_col.update_one(_event_id_query(event_id), {"$set": {field: url}})

    # Sync to linked opportunity
    try:
        await opportunities_col.update_many(
            {"event_link_id": str(event_id)},
            {"$set": {field: url}}
        )
    except Exception as e:
        logger.warning(f"[SYNC] Failed to update opportunity media: {e}")

    return {"url": url, "field": field}


@router.post("/events/{event_id}/stages")
async def add_event_stage(event_id: str, stage: dict, user: dict = Depends(get_auth_user)):
    """Adds a new stage to an event's workflow."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col
    import uuid
    stage["id"] = str(uuid.uuid4())
    stage["created_at"] = datetime.utcnow()
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$push": {"stages": stage}}
    )
    return {"status": "success", "stage_id": stage["id"]}

@router.put("/events/{event_id}/stages/{stage_id}")
async def update_event_stage(event_id: str, stage_id: str, stage_update: dict, user: dict = Depends(get_auth_user)):
    """Updates a specific stage within an event."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col
    # MongoDB positional update for array
    await events_col.update_one(
        {"_id": ObjectId(event_id), "stages.id": stage_id},
        {"$set": {"stages.$": stage_update}}
    )
    return {"status": "success"}

@router.delete("/events/{event_id}/stages/{stage_id}")
async def delete_event_stage(event_id: str, stage_id: str, user: dict = Depends(get_auth_user)):
    """Removes a specific stage from an event's workflow and updates remaining stages' order."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col
    
    # Get current event to check if stage exists
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    stages = event.get("stages", [])
    stage_to_delete = None
    
    # Find the stage to delete
    for stage in stages:
        if stage.get("id") == stage_id:
            stage_to_delete = stage
            break
    
    if not stage_to_delete:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    # Check if this is the last stage (prevent deletion if it would break workflow)
    if len(stages) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last stage")
    
    # Remove the stage and reorder remaining stages
    remaining_stages = [stage for stage in stages if stage.get("id") != stage_id]
    
    # Update order indices for remaining stages
    for i, stage in enumerate(remaining_stages):
        stage["order"] = i + 1
        stage["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update event with new stages list
    result = await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {
            "$set": {
                "stages": remaining_stages,
                "stages_updated_at": datetime.now(timezone.utc).isoformat(),
                "last_stage_deleted": {
                    "stage_id": stage_id,
                    "stage_name": stage_to_delete.get("name", "Unknown"),
                    "deleted_at": datetime.now(timezone.utc).isoformat(),
                    "deleted_by": user.get("user_id")
                }
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete stage")
    
    # Create notification for institution
    await notify_institution(
        user.get("institution_id"),
        f"Stage '{stage_to_delete.get('name', 'Unknown')}' deleted from event",
        ntype="stage_deleted",
        title="Stage Deleted",
        meta={
            "event_id": event_id,
            "stage_id": stage_id,
            "stage_name": stage_to_delete.get("name", "Unknown"),
            "remaining_stages": len(remaining_stages)
        }
    )
    
    return {
        "status": "success",
        "deleted_stage": {
            "id": stage_id,
            "name": stage_to_delete.get("name", "Unknown")
        },
        "remaining_stages": len(remaining_stages)
    }

@router.patch("/events/{event_id}/advance-stage")
async def advance_participants(event_id: str, participant_ids: list, next_stage: str, user: dict = Depends(get_auth_user)):
    """Internal Process: Advances participants and triggers phase-specific notifications."""
    await assert_institution_owns_event(event_id, user)
    from db import notifications_col, events_col
    from services.event_workflow_service import workflow_service
    
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    event_title = event.get("title", "Event")

    # 1. Run internal business rules for this specific phase
    from services.event_workflow_service import workflow_service
    await workflow_service.process_phase_transition(event_id, participant_ids, next_stage)

    # 2. Update database (Restored explicit visibility)
    from db import participants_col
    await participants_col.update_many(
        {"_id": {"$in": [ObjectId(pid) for pid in participant_ids]}, "event_id": event_id},
        {"$set": {"current_stage": next_stage, "status": "Shortlisted"}}
    )

    # 2. Trigger Dynamic Notifications/Emails for each participant
    notifs = []
    for pid in participant_ids:
        notifs.append({
            "user_id": pid,
            "event_id": event_id,
            "message": f"Congratulations! You've advanced to the '{next_stage}' stage of {event_title}.",
            "type": "PHASE_ADVANCEMENT",
            "timestamp": datetime.utcnow().isoformat(),
            "is_read": False
        })
    
    if notifs:
        await notifications_col.insert_many(notifs)

    await log_admin_action("admin@institution.com", "STAGE_ADVANCED", f"Advanced {len(participant_ids)} users to {next_stage} in {event_title}")
    return {"status": "success", "notified_count": len(participant_ids)}

@router.post("/events/{event_id}/judges")
async def add_event_judge(event_id: str, judge_data: dict, user: dict = Depends(get_auth_user)):
    """
    Adds a judge to an event and sends an invitation email.
    """
    await assert_institution_owns_event(event_id, user)
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if not event: raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if judge already exists
    current_judges = event.get("judges", [])
    if any(j.get("email") == judge_data.get("email") for j in current_judges):
        return {"status": "exists", "message": "Judge already assigned"}
    
    from judge_portal_service import judge_portal_service
    
    # Delegate to the new Judge Portal Service which creates the token, inserts into judges_col, and sends the rich HTML email
    result = await judge_portal_service.create_judge_invitation(
        event_id, judge_data, user.get("institution_id")
    )
    
    # Fetch the created judge document to get the token (or generate a fallback if not returned)
    from db import judges_col
    judge_doc = await judges_col.find_one({"_id": ObjectId(result["judge_id"])})
    
    # Also push to the event['judges'] array for backwards compatibility with the frontend EventDetails page
    judge_entry = {
        "id": str(result["judge_id"]),
        "name": judge_data.get("name"),
        "email": judge_data.get("email"),
        "expertise": judge_data.get("expertise"),
        "status": "INVITED",
        "invitation_token": judge_doc.get("invitation_token") if judge_doc else None,
        "assigned_at": datetime.now(timezone.utc).isoformat()
    }
    
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$push": {"judges": judge_entry}}
    )
    
    return {"status": "success", "judge": judge_entry}

@router.delete("/events/{event_id}/judges/{judge_email}")
async def remove_event_judge(event_id: str, judge_email: str, user: dict = Depends(get_auth_user)):
    """Removes a judge from an event."""
    await assert_institution_owns_event(event_id, user)
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$pull": {"judges": {"email": judge_email}}}
    )
    return {"status": "success"}

@router.post("/events/{event_id}/criteria")
async def update_judging_criteria(event_id: str, criteria_data: List[dict], user: dict = Depends(get_auth_user)):
    """
    Updates the scoring rubrics for an event.
    """
    await assert_institution_owns_event(event_id, user)
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"judging_criteria": criteria_data, "updated_at": datetime.utcnow()}}
    )
    return {"status": "success"}

@router.get("/events/{event_id}/quizzes")
async def get_event_quizzes(event_id: str, user: dict = Depends(get_auth_user)):
    """Retrieves all assessments/quizzes linked to a specific event."""
    await assert_institution_owns_event(event_id, user)
    from db import quizzes_col
    cursor = quizzes_col.find({"event_id": event_id})
    quizzes = await cursor.to_list(length=100)
    for q in quizzes:
        q["_id"] = str(q["_id"])
    return quizzes

@router.post("/events/{event_id}/quizzes")
async def create_event_quiz(event_id: str, quiz_data: dict, user: dict = Depends(get_auth_user)):
    """Creates a new assessment round with questions and timing."""
    await assert_institution_owns_event(event_id, user)
    from db import quizzes_col
    # Validation: only allow supported question protocols
    try:
        title = str(quiz_data.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Quiz title is required")
        duration = int(quiz_data.get("duration") or 0)
        if duration <= 0:
            raise HTTPException(status_code=400, detail="Time limit must be > 0 minutes")
        questions = quiz_data.get("questions") or []
        if not isinstance(questions, list) or len(questions) == 0:
            raise HTTPException(status_code=400, detail="At least one question is required")
        for i, q in enumerate(questions):
            if not isinstance(q, dict):
                raise HTTPException(status_code=400, detail=f"Invalid question payload at #{i+1}")
            qtype = str(q.get("type") or "").strip().upper()
            text = str(q.get("text") or "").strip()
            if not text:
                raise HTTPException(status_code=400, detail=f"Question #{i+1}: problem statement is required")
            if qtype == "SINGLE_CHOICE":
                opts = q.get("options")
                if not isinstance(opts, list) or len(opts) < 2:
                    raise HTTPException(status_code=400, detail=f"Question #{i+1}: at least 2 options are required")
                if any(not str(o or "").strip() for o in opts):
                    raise HTTPException(status_code=400, detail=f"Question #{i+1}: options cannot be empty")
                coi = q.get("correctOptionIndex")
                if not isinstance(coi, int) or coi < 0 or coi >= len(opts):
                    raise HTTPException(status_code=400, detail=f"Question #{i+1}: select exactly one correct answer")
            elif qtype == "CODING":
                lang = str(q.get("language") or "").strip().lower()
                if not lang:
                    raise HTTPException(status_code=400, detail=f"Question #{i+1}: coding language is required")
            else:
                raise HTTPException(status_code=400, detail=f"Question #{i+1}: unsupported type '{qtype}'")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz payload")
    quiz_data["event_id"] = event_id
    quiz_data["created_at"] = datetime.utcnow().isoformat()
    result = await quizzes_col.insert_one(quiz_data)
    return {"quiz_id": str(result.inserted_id)}


@router.post("/events/{event_id}/quizzes/{quiz_id}/submit")
async def submit_event_quiz(event_id: str, quiz_id: str, payload: dict = Body(...), user: dict = Depends(get_auth_user)):
    """Learner submits an event quiz attempt (auto-evaluates single-choice)."""
    from db import quizzes_col, participants_col, events_col, opportunity_applications_col
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    quiz = await quizzes_col.find_one({"_id": ObjectId(quiz_id), "event_id": str(event_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    ev = await events_col.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check quiz visibility based on stage visibility
    await _check_quiz_visibility(event_id, quiz_id, uid, ev)

    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    if not p:
        raise HTTPException(status_code=400, detail="You must register/apply before attempting the assessment")

    answers = payload.get("answers") or []
    if not isinstance(answers, list):
        raise HTTPException(status_code=400, detail="answers must be a list")

    questions = quiz.get("questions") or []
    total = 0
    correct = 0
    coding_pending = False
    coding_answers = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
        qtype = str(q.get("type") or "").upper()
        if qtype == "SINGLE_CHOICE":
            total += 1
            expected = q.get("correctOptionIndex")
            got = None
            if i < len(answers) and isinstance(answers[i], dict):
                got = answers[i].get("selectedIndex")
            if isinstance(expected, int) and isinstance(got, int) and expected == got:
                correct += 1
        elif qtype == "CODING":
            coding_pending = True
            if i < len(answers) and isinstance(answers[i], dict):
                coding_answers.append(
                    {
                        "q_index": i,
                        "code": answers[i].get("code") or "",
                        "language": answers[i].get("language") or q.get("language") or "",
                    }
                )

    score = int(round((correct / total) * 100)) if total > 0 else 0
    pass_mark = int(quiz.get("pass_mark") or payload.get("pass_mark") or 0)
    passed = (total > 0 and score >= pass_mark if pass_mark > 0 else False) and (not coding_pending)

    attempt = {
        "quiz_id": str(quiz_id),
        "score": score,
        "pass_mark": pass_mark,
        "passed": passed,
        "coding_pending_review": coding_pending,
        "coding_answers": coding_answers,
        "submitted_at": datetime.utcnow().isoformat(),
    }
    await participants_col.update_one(
        {"_id": p["_id"]},
        {"$push": {"quiz_attempts": attempt}, "$set": {"updated_at": datetime.utcnow()}},
    )

    if passed:
        # Mirror shortlist state into portal application + notify learner + institution
        opp = await opportunities_col.find_one({"event_link_id": str(event_id)})
        if opp:
            await opportunity_applications_col.update_many(
                {"opportunity_id": str(opp["_id"]), "user_id": uid},
                {"$set": {"status": "shortlisted", "reviewed_at": datetime.utcnow()}},
            )
        await participants_col.update_many(
            {"event_id": str(event_id), "user_id": uid},
            {"$set": {"status": "shortlisted", "updated_at": datetime.utcnow()}},
        )
        # in-app learner notification
        try:
            await notifications_col.insert_one(
                {
                    "user_id": uid,
                    "type": "stage_shortlisted",
                    "message": f'You qualified for the next stage in "{ev.get("title")}".',
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "meta": {"event_id": str(event_id), "quiz_id": str(quiz_id), "score": score},
                }
            )
        except Exception:
            pass
        # email + institution bell
        try:
            email = str(user.get("email") or "").strip()
            if email:
                subj = f"Shortlisted: {ev.get('title')}"
                body = f"<html><body><p>You passed the assessment (score {score}%). You are shortlisted for the next stage.</p></body></html>"
                asyncio.create_task(send_notification_email(email, subj, body))
        except Exception:
            pass
        await notify_institution(
            str(ev.get("institution_id") or ""),
            f"A learner qualified via assessment in {ev.get('title')} (score {score}%).",
            ntype="success",
            title="Assessment qualified",
            meta={"event_id": str(event_id), "quiz_id": str(quiz_id)},
        )

    return {
        "status": "success",
        "score": score,
        "passed": passed,
        "pass_mark": pass_mark,
        "total_scored": total,
        "coding_pending_review": coding_pending,
    }


@router.get("/events/{event_id}/quizzes/{quiz_id}/coding-attempts")
async def list_coding_attempts(event_id: str, quiz_id: str, user: dict = Depends(get_auth_user)):
    """Institution view: pending coding evaluations for a quiz."""
    await assert_institution_owns_event(event_id, user)
    rows = []
    cursor = participants_col.find(
        {
            "event_id": str(event_id),
            "quiz_attempts": {
                "$elemMatch": {
                    "quiz_id": str(quiz_id),
                    "coding_pending_review": True,
                }
            },
        }
    )
    async for p in cursor:
        attempts = p.get("quiz_attempts") or []
        latest = None
        for a in reversed(attempts):
            if str(a.get("quiz_id")) == str(quiz_id) and a.get("coding_pending_review"):
                latest = a
                break
        if not latest:
            continue
        rows.append(
            {
                "participant_id": str(p.get("_id")),
                "user_id": str(p.get("user_id") or ""),
                "status": p.get("status"),
                "current_stage": p.get("current_stage"),
                "submitted_at": latest.get("submitted_at"),
                "coding_answers": latest.get("coding_answers") or [],
                "auto_score": latest.get("score", 0),
                "pass_mark": latest.get("pass_mark", 0),
            }
        )
    return {"items": rows}


@router.post("/events/{event_id}/quizzes/{quiz_id}/coding-attempts/{participant_user_id}/evaluate")
async def evaluate_coding_attempt(
    event_id: str,
    quiz_id: str,
    participant_user_id: str,
    payload: dict = Body(...),
    user: dict = Depends(get_auth_user),
):
    """Institution action: manually score coding attempt and decide shortlist outcome."""
    await assert_institution_owns_event(event_id, user)
    score = int(payload.get("score", 0))
    passed = bool(payload.get("passed", False))
    remarks = str(payload.get("remarks") or "").strip()
    participant = await participants_col.find_one({"event_id": str(event_id), "user_id": str(participant_user_id)})
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    attempts = participant.get("quiz_attempts") or []
    idx = -1
    for i in range(len(attempts) - 1, -1, -1):
        a = attempts[i]
        if str(a.get("quiz_id")) == str(quiz_id) and a.get("coding_pending_review"):
            idx = i
            break
    if idx < 0:
        raise HTTPException(status_code=404, detail="Pending coding attempt not found")

    attempts[idx]["coding_pending_review"] = False
    attempts[idx]["manual_reviewed"] = True
    attempts[idx]["manual_score"] = score
    attempts[idx]["manual_passed"] = passed
    attempts[idx]["manual_remarks"] = remarks
    attempts[idx]["reviewed_at"] = datetime.utcnow().isoformat()
    attempts[idx]["reviewed_by"] = str(user.get("user_id") or "")
    attempts[idx]["passed"] = passed

    await participants_col.update_one(
        {"_id": participant["_id"]},
        {"$set": {"quiz_attempts": attempts, "updated_at": datetime.utcnow(), **({"status": "shortlisted"} if passed else {})}},
    )

    if passed:
        opp = await opportunities_col.find_one({"event_link_id": str(event_id)})
        if opp:
            await opportunity_applications_col.update_many(
                {"opportunity_id": str(opp["_id"]), "user_id": str(participant_user_id)},
                {"$set": {"status": "shortlisted", "reviewed_at": datetime.utcnow()}},
            )
    await notifications_col.insert_one(
        {
            "user_id": str(participant_user_id),
            "type": "coding_review_result",
            "message": f"Your coding round was reviewed. Result: {'Qualified' if passed else 'Not qualified'}",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
            "meta": {"event_id": str(event_id), "quiz_id": str(quiz_id), "manual_score": score, "passed": passed},
        }
    )
    return {"status": "success", "passed": passed, "score": score}

@router.post("/events/create-professional")
async def create_pro_event(request: Request, user: dict = Depends(get_auth_user)):
    """Creates a high-end event with stages, fees, and prizes, supporting multipart images."""
    from db import events_col
    
    # 1. Parse Form Data
    form = await request.form()
    event_data = {}
    
    # Extract all string/json fields
    for key, value in form.items():
        if key in ['logo_file', 'banner_file', 'festival_logo_file', 'festival_banner_file']:
            continue
            
        try:
            # Try to parse as JSON if it looks like an object/array
            if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                event_data[key] = json.loads(value)
            else:
                # Handle numeric strings
                if isinstance(value, str) and value.isdigit():
                    event_data[key] = int(value)
                elif value.lower() == 'true':
                    event_data[key] = True
                elif value.lower() == 'false':
                    event_data[key] = False
                else:
                    event_data[key] = value
        except:
            event_data[key] = value

    # 2. Handle Image Uploads
    async def save_image(upload_file: UploadFile, prefix: str):
        if not upload_file or not upload_file.filename:
            return None
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return None
            
        fname = f"{prefix}_{uuid.uuid4()}{ext}"
        fpath = os.path.join(EVENTS_UPLOAD_DIR, fname)
        
        # Ensure we read the file correctly
        content = await upload_file.read()
        with open(fpath, "wb") as f:
            f.write(content)
            
        return f"{BASE_URL}/uploads/events/{fname}"

    # Process files
    logo_file = form.get('logo_file')
    banner_file = form.get('banner_file')
    fest_logo_file = form.get('festival_logo_file')
    fest_banner_file = form.get('festival_banner_file')
    
    print("=== DEBUG CREATE PRO EVENT ===")
    print("Form keys:", list(form.keys()))
    print("logo_file:", logo_file, "type:", type(logo_file))
    print("banner_file:", banner_file, "type:", type(banner_file))
    
    if logo_file and hasattr(logo_file, "filename") and logo_file.filename:
        url = await save_image(logo_file, "logo")
        print("Saved logo URL:", url)
        if url: event_data["logo_url"] = url
        
    if banner_file and hasattr(banner_file, "filename") and banner_file.filename:
        url = await save_image(banner_file, "banner")
        if url: event_data["banner_url"] = url

    # Handle festival images if present
    if "festivalData" in event_data:
        fest_data = event_data["festivalData"]
        if fest_logo_file and hasattr(fest_logo_file, "filename") and fest_logo_file.filename:
            url = await save_image(fest_logo_file, "fest_logo")
            if url: fest_data["logo_url"] = url
        if fest_banner_file and hasattr(fest_banner_file, "filename") and fest_banner_file.filename:
            url = await save_image(fest_banner_file, "fest_banner")
            if url: fest_data["banner_url"] = url
        event_data["festivalData"] = fest_data

    # 3. Finalize Event Data
    if "opportunityType" in event_data:
        event_data["category"] = event_data["opportunityType"]
    event_data["created_at"] = datetime.utcnow()
    status_val = form.get("status")
    if status_val:
        event_data["status"] = str(status_val).upper()
    else:
        event_data["status"] = "DRAFT"

    _rd = event_data.get("registrationDeadline")
    fd = event_data.get("festivalData") if isinstance(event_data.get("festivalData"), dict) else {}
    if not event_data.get("start_date") and not event_data.get("startDate"):
        event_data["start_date"] = fd.get("startDate") or _rd
    if not event_data.get("end_date") and not event_data.get("endDate"):
        event_data["end_date"] = fd.get("endDate") or fd.get("startDate") or _rd
    
    # Stages should be defined by the institution UI.
    # If not provided, keep it empty (avoid auto/hardcoded stages).
    if "stages" not in event_data or event_data.get("stages") is None:
        event_data["stages"] = []

    iid = event_data.get("institution_id")
    if not iid:
        raise HTTPException(status_code=400, detail="institution_id is required")
    assert_institution_scope(str(iid), user)
        
    result = await events_col.insert_one(event_data)
    
    # 4. Production Trigger: Create a notification record
    from db import notifications_col
    try:
        await notifications_col.insert_one({
            "institution_id": str(iid),
            "title": "Event Published",
            "message": f"'{event_data.get('title')}' is now live on the portal.",
            "type": "info",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"[NOTIF ERROR] Trigger failed: {str(e)}")

    # [SYNC] Centralized Opportunity Pipeline
    # Mirror high-level event metadata to the centralized 'opportunities' collection 
    # for student dashboard integration.
    try:
        # Determine opportunity type from category/opportunityType
        opp_type = event_data.get("opportunityType", "Competition")
        if "Hackathon" in opp_type: opp_type = "Hackathon"
        elif "Job" in opp_type: opp_type = "Job"
        elif "Internship" in opp_type: opp_type = "Internship"
        else: opp_type = "Competition"

        reg_fields = event_data.get("registrationFields") or []
        if isinstance(reg_fields, str):
            try:
                reg_fields = json.loads(reg_fields)
            except Exception:
                reg_fields = []

        _city = (event_data.get("city") or event_data.get("venueAddress") or "").strip()
        _mode = (event_data.get("opportunityMode") or "online").strip()
        if _city:
            _location = f"{_city}, {_mode}"
        else:
            _location = _mode or "online"

        opp_data = {
            "title": event_data.get("title", "New Opportunity"),
            "organization": event_data.get("organisation", "Partner Institution"),
            "type": opp_type,
            "description": event_data.get("description", ""),
            "skills": event_data.get("skills", ""),
            "location": _location,
            "deadline": event_data.get("registrationDeadline", datetime.now(timezone.utc)),
            "applicantsCount": 0,
            "createdAt": datetime.utcnow(),
            "createdBy": str(iid),
            "institution_id": str(iid),
            "status": "active",
            "event_link_id": str(result.inserted_id),  # link back to full event
            "registrationFields": reg_fields,
            "logo_url": event_data.get("logo_url", ""),
            "banner_url": event_data.get("banner_url", ""),
        }
        
        # Ensure deadline is datetime
        if isinstance(opp_data["deadline"], str):
            try:
                opp_data["deadline"] = datetime.fromisoformat(opp_data["deadline"].replace("Z", "+00:00"))
            except:
                opp_data["deadline"] = datetime.now(timezone.utc)

        await opportunities_col.insert_one(opp_data)
        logger.info(f"[SYNC] Event {result.inserted_id} mirrored to opportunities collection.")
    except Exception as e:
        logger.error(f"[SYNC ERROR] Failed to mirror event to opportunities: {str(e)}")

    return {"event_id": str(result.inserted_id), "status": "success"}


@router.patch("/events/{event_id}/professional")
async def update_pro_event(event_id: str, request: Request, user: dict = Depends(get_auth_user)):
    """Updates a high-end event with stages, fees, and prizes, supporting multipart images."""
    await assert_institution_owns_event(event_id, user)
    from db import events_col, opportunities_col
    
    # 1. Parse Form Data
    form = await request.form()
    event_data = {}
    
    # Extract all string/json fields
    for key, value in form.items():
        if key in ['logo_file', 'banner_file', 'festival_logo_file', 'festival_banner_file']:
            continue
            
        try:
            # Try to parse as JSON if it looks like an object/array
            if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                event_data[key] = json.loads(value)
            else:
                # Handle numeric strings
                if isinstance(value, str) and value.isdigit():
                    event_data[key] = int(value)
                elif value.lower() == 'true':
                    event_data[key] = True
                elif value.lower() == 'false':
                    event_data[key] = False
                else:
                    event_data[key] = value
        except:
            event_data[key] = value

    # 2. Handle Image Uploads
    async def save_image(upload_file: UploadFile, prefix: str):
        if not upload_file or not upload_file.filename:
            return None
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return None
            
        fname = f"{prefix}_{uuid.uuid4()}{ext}"
        fpath = os.path.join(EVENTS_UPLOAD_DIR, fname)
        
        # Ensure we read the file correctly
        content = await upload_file.read()
        with open(fpath, "wb") as f:
            f.write(content)
            
        return f"{BASE_URL}/uploads/events/{fname}"

    # Process files
    logo_file = form.get('logo_file')
    banner_file = form.get('banner_file')
    fest_logo_file = form.get('festival_logo_file')
    fest_banner_file = form.get('festival_banner_file')
    
    print("=== DEBUG UPDATE PRO EVENT ===")
    print("Form keys:", list(form.keys()))
    print("logo_file:", logo_file, "type:", type(logo_file))
    print("banner_file:", banner_file, "type:", type(banner_file))
    
    if logo_file and hasattr(logo_file, "filename") and logo_file.filename:
        url = await save_image(logo_file, "logo")
        print("Saved logo URL:", url)
        if url: event_data["logo_url"] = url
        
    if banner_file and hasattr(banner_file, "filename") and banner_file.filename:
        url = await save_image(banner_file, "banner")
        if url: event_data["banner_url"] = url

    # Handle festival images if present
    if "festivalData" in event_data:
        fest_data = event_data["festivalData"]
        if fest_logo_file and hasattr(fest_logo_file, "filename") and fest_logo_file.filename:
            url = await save_image(fest_logo_file, "fest_logo")
            if url: fest_data["logo_url"] = url
        if fest_banner_file and hasattr(fest_banner_file, "filename") and fest_banner_file.filename:
            url = await save_image(fest_banner_file, "fest_banner")
            if url: fest_data["banner_url"] = url
        event_data["festivalData"] = fest_data

    # Remove fields we shouldn't overwrite in update unless desired
    if "_id" in event_data: del event_data["_id"]
    if "opportunityType" in event_data:
        event_data["category"] = event_data["opportunityType"]
    event_data["updated_at"] = datetime.utcnow()

    # Read status from form field (sent by frontend as 'status'), default to existing status
    status_val = form.get('status')
    if status_val:
        event_data["status"] = str(status_val).upper()

    _rd = event_data.get("registrationDeadline")
    fd = event_data.get("festivalData") if isinstance(event_data.get("festivalData"), dict) else {}
    if _rd:
        if not event_data.get("start_date") and not event_data.get("startDate"):
            event_data["start_date"] = fd.get("startDate") or _rd
        if not event_data.get("end_date") and not event_data.get("endDate"):
            event_data["end_date"] = fd.get("endDate") or fd.get("startDate") or _rd

    # Synchronize registration Deadline from stages if provided
    if isinstance(event_data.get("stages"), list):
        for s in event_data["stages"]:
            if isinstance(s, dict) and not s.get("id"):
                s["id"] = str(uuid.uuid4())
            if isinstance(s, dict) and str(s.get("type", "")).upper() == "REGISTRATION":
                reg_end = s.get("end_date") or s.get("endDate") or s.get("deadline")
                if reg_end:
                    event_data["registrationDeadline"] = reg_end

    # Perform update in events collection
    await events_col.update_one({"_id": ObjectId(event_id)}, {"$set": event_data})
    
    # Retrieve updated event to sync with opportunities
    updated_event = await events_col.find_one({"_id": ObjectId(event_id)})
    if updated_event:
        # [SYNC] Centralized Opportunity Pipeline
        try:
            opp_type = updated_event.get("opportunityType", "Competition")
            if "Hackathon" in opp_type: opp_type = "Hackathon"
            elif "Job" in opp_type: opp_type = "Job"
            elif "Internship" in opp_type: opp_type = "Internship"
            else: opp_type = "Competition"

            reg_fields = updated_event.get("registrationFields") or []
            if isinstance(reg_fields, str):
                try:
                    reg_fields = json.loads(reg_fields)
                except:
                    reg_fields = []

            _city = (updated_event.get("city") or updated_event.get("venueAddress") or "").strip()
            _mode = (updated_event.get("opportunityMode") or "online").strip()
            if _city:
                _location = f"{_city}, {_mode}"
            else:
                _location = _mode or "online"

            opp_data = {
                "title": updated_event.get("title", "New Opportunity"),
                "organization": updated_event.get("organisation", "Partner Institution"),
                "type": opp_type,
                "description": updated_event.get("description", ""),
                "skills": updated_event.get("skills", ""),
                "location": _location,
                "deadline": updated_event.get("registrationDeadline", datetime.now(timezone.utc)),
                "registrationFields": reg_fields,
                "logo_url": updated_event.get("logo_url", ""),
                "banner_url": updated_event.get("banner_url", ""),
            }

            if updated_event.get("status"):
                opp_data["status"] = "active"
            
            # Ensure deadline is datetime
            if isinstance(opp_data["deadline"], str):
                try:
                    opp_data["deadline"] = datetime.fromisoformat(opp_data["deadline"].replace("Z", "+00:00"))
                except:
                    opp_data["deadline"] = datetime.now(timezone.utc)

            await opportunities_col.update_many({"event_link_id": str(event_id)}, {"$set": opp_data})
            logger.info(f"[SYNC] Event {event_id} updates mirrored to opportunities collection.")
        except Exception as e:
            logger.error(f"[SYNC ERROR] Failed to mirror event update to opportunities: {str(e)}")

    return {"status": "success"}

# ============================================================
# EXPORT & DISTRIBUTION ENDPOINTS (Blueprint Requirements)
# ============================================================

# Removed duplicate unscoped export route

@router.get("/leaderboard/{event_id}/export-pdf")
async def export_leaderboard_pdf(event_id: str):
    """Generates a PDF export of the leaderboard for a specific event."""
    from fastapi.responses import FileResponse
    from db import scores_col, submissions_col, teams_col
    import os

    # Resolve placeholders
    if event_id in ["active_event", "ALL"]:
        event = await events_col.find_one({"status": "Live"}, sort=[("created_at", -1)])
        if not event: event = await events_col.find_one({}, sort=[("created_at", -1)])
        if event: 
            event_id = str(event["_id"])
            event_title = event.get("title", "Event") if event_id != "ALL" else "All Events Master Leaderboard"
        else: 
            raise HTTPException(status_code=404, detail="No events found to export.")
    else:
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        event_title = event.get("title", "Event")
    
    # Aggregate scores (if ALL, we match all scores, otherwise just the specific event)
    match_query = {} if event_id == "ALL" else {"event_id": event_id}
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$submission_id", "avg_score": {"$avg": "$total_score"}}},
        {"$sort": {"avg_score": -1}}
    ]
    results = await scores_col.aggregate(pipeline).to_list(100)

    # Build simple HTML table for PDF
    rows_html = ""
    for rank, r in enumerate(results, 1):
        sub = await submissions_col.find_one({"_id": ObjectId(r["_id"])}) if r.get("_id") else None
        team_name = "Individual"
        if sub and sub.get("team_id"):
            team = await teams_col.find_one({"_id": ObjectId(sub["team_id"])})
            team_name = team.get("team_name", "Team") if team else "Team"
        project = sub.get("project_title", "N/A") if sub else "N/A"
        rows_html += f"<tr><td>{rank}</td><td>{team_name}</td><td>{project}</td><td>{round(r['avg_score'], 2)}</td></tr>"

    html_content = f"""
    <html><head><style>
        body {{ font-family: Arial, sans-serif; padding: 40px; }}
        h1 {{ color: #1e293b; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th, td {{ border: 1px solid #e2e8f0; padding: 12px; text-align: left; }}
        th {{ background: #1e293b; color: white; }}
        tr:nth-child(even) {{ background: #f8fafc; }}
    </style></head><body>
        <h1>{event_title} — Final Leaderboard</h1>
        <p>Generated: {datetime.utcnow().strftime('%B %d, %Y')}</p>
        <table><tr><th>Rank</th><th>Team</th><th>Project</th><th>Score</th></tr>{rows_html}</table>
    </body></html>"""

    os.makedirs("artifacts/exports", exist_ok=True)
    pdf_path = f"artifacts/exports/leaderboard_{event_id}.pdf"
    try:
        from weasyprint import HTML as WPHTML
        WPHTML(string=html_content).write_pdf(pdf_path)
    except ImportError:
        # Fallback: return HTML if weasyprint not available
        html_path = f"artifacts/exports/leaderboard_{event_id}.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return FileResponse(html_path, media_type="text/html", filename=f"leaderboard_{event_title}.html")

    return FileResponse(pdf_path, media_type="application/pdf", filename=f"leaderboard_{event_title}.pdf")

# Removed duplicate unscoped analytics routes
@router.get("/export-participants/{institution_id}")
async def export_institution_participants(institution_id: str, user: dict = Depends(get_auth_user)):
    """Generates a CSV export of all registered participants for the institution."""
    assert_institution_scope(institution_id, user)
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    cursor = participants_col.find({"institution_id": institution_id})
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Event ID", "Status", "Joined Date"])
    
    async for p in cursor:
        writer.writerow([
            p.get("full_name") or p.get("name", "N/A"),
            p.get("email", "N/A"),
            p.get("phone", "N/A"),
            p.get("event_id", "N/A"),
            p.get("status", "N/A"),
            p.get("created_at", "N/A")
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=participants_{institution_id}.csv"}
    )

@router.post("/members/bulk")
async def bulk_onboard_members(data: dict):
    """
    Professional Bulk Onboarding Engine.
    Handles bulk insertion of Judges or Participants with automated duplicate detection.
    """
    from db import users_col
    members = data.get("members", [])
    inst_id = data.get("institution_id")
    role = data.get("role", "student") # judge or student
    
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required")
        
    results = {"added": 0, "skipped": 0, "errors": []}
    
    for member in members:
        email = member.get("email", "").strip().lower()
        if not email: continue
        
        # 1. Check if they already exist in this institution
        existing = await participants_col.find_one({"email": email, "institution_id": inst_id})
        if existing:
            results["skipped"] += 1
            continue
            
        try:
            # 2. Create the member record
            new_member = {
                "full_name": member.get("name", "New Member"),
                "email": email,
                "phone": member.get("phone", ""),
                "institution_id": inst_id,
                "role": role,
                "status": "invited",
                "created_at": datetime.utcnow()
            }
            
            await participants_col.insert_one(new_member)
            
            # 3. Trigger High-End Production Invitation Email
            subject = f"Invitation: Authorized {role.capitalize()} Access for {inst_id}"
            body = f"""
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
                    .email-container {{
                        font-family: 'Outfit', 'Segoe UI', Tahoma, sans-serif;
                        max-width: 650px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #f1f5f9;
                        border-radius: 32px;
                        overflow: hidden;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                    }}
                    .hero-section {{
                        background: linear-gradient(135deg, #6C3BFF 0%, #8B5CF6 100%);
                        padding: 60px 40px;
                        text-align: center;
                        color: white;
                    }}
                    .content-section {{
                        padding: 50px;
                        color: #334155;
                        line-height: 1.8;
                    }}
                    .badge {{
                        background: rgba(255,255,255,0.2);
                        padding: 6px 16px;
                        border-radius: 100px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        display: inline-block;
                        margin-bottom: 20px;
                    }}
                    .btn-primary {{
                        background: #6C3BFF;
                        color: white !important;
                        padding: 18px 45px;
                        border-radius: 16px;
                        text-decoration: none;
                        font-weight: 800;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        display: inline-block;
                        box-shadow: 0 10px 25px rgba(108, 59, 255, 0.3);
                        margin: 30px 0;
                    }}
                    .step-card {{
                        background: #f8fafc;
                        border-radius: 24px;
                        padding: 25px;
                        margin-top: 20px;
                        border: 1px solid #f1f5f9;
                    }}
                    .footer {{
                        background: #f8fafc;
                        padding: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #94a3b8;
                    }}
                </style>
            </head>
            <body style="background-color: #f1f5f9; padding: 40px 0;">
                <div class="email-container">
                    <div class="hero-section">
                        <div class="badge">Official Onboarding</div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Welcome to the Future.</h1>
                    </div>
                    <div class="content-section">
                        <p style="font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0;">Hello {new_member['full_name']},</p>
                        <p>You have been selected by <strong>{inst_id}</strong> to join the <strong>Studlyf Institutional Network</strong> as a verified <strong>{role.capitalize()}</strong>.</p>
                        
                        <div class="step-card">
                            <p style="margin: 0; font-weight: 800; color: #6C3BFF; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Your Next Steps</p>
                            <ul style="margin: 15px 0 0 0; padding-left: 20px; font-size: 14px; font-weight: 500;">
                                <li style="margin-bottom: 10px;">Click the activation button below to verify your identity.</li>
                                <li style="margin-bottom: 10px;">Set up your profile and areas of expertise.</li>
                                <li style="margin-bottom: 0;">Access assigned submissions and start your evaluation journey.</li>
                            </ul>
                        </div>

                        <div style="text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login" class="btn-primary">Initialize Dashboard Access</a>
                        </div>

                        <p style="font-size: 14px; font-weight: 500; text-align: center;">Need assistance? Our team is available 24/7 to help you settle in.</p>
                    </div>
                    <div class="footer">
                        <p style="margin-bottom: 10px;">&copy; 2026 Studlyf Technologies Inc. All Rights Reserved.</p>
                        <p>You received this because an authorized administrator at {inst_id} invited you to their private network.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            asyncio.create_task(send_notification_email(email, subject, body))
            
            results["added"] += 1
        except Exception as e:
            results["errors"].append(f"Error adding {email}: {str(e)}")
            
    return results

@router.get("/institution/stats/{institution_id}")
async def get_institution_stats(institution_id: str):
    """
    Production-ready statistics for the Institutional Dashboard.
    Aggregates real data from events, teams, and participants.
    """
    try:
        # 1. Active Events
        active_events_count = await db.events.count_documents({
            "institution_id": institution_id,
            "status": "live"
        })

        # 2. Total Teams
        # We find all events for this institution first
        inst_events = await db.events.find({"institution_id": institution_id}).to_list(length=None)
        event_ids = [str(e["_id"]) for e in inst_events]
        
        total_teams_count = 0
        total_participants = 0
        
        if event_ids:
            total_teams_count = await db.teams.count_documents({
                "event_id": {"$in": event_ids}
            })

            # 3. Total Participants
            # Count unique user_ids across all teams in those events
            pipeline = [
                {"$match": {"event_id": {"$in": event_ids}}},
                {"$unwind": "$members"},
                {"$group": {"_id": "$members.user_id"}},
                {"$count": "total"}
            ]
            participants_res = await db.teams.aggregate(pipeline).to_list(length=1)
            total_participants = participants_res[0]["total"] if participants_res else 0

        # 4. Average Score (Calculated from evaluations)
        avg_score = 0
        if event_ids:
            evals = await db.evaluations.find({"event_id": {"$in": event_ids}}).to_list(length=None)
            if evals:
                total_points = sum(e.get("total_score", 0) for e in evals)
                avg_score = round(total_points / len(evals), 1)

        return {
            "total_participants": total_participants,
            "active_events": active_events_count,
            "total_teams": total_teams_count,
            "average_score": f"{avg_score}%" if avg_score > 0 else "0%"
        }
    except Exception as e:
        print(f"Error fetching stats: {str(e)}")
        return {
            "total_participants": 0,
            "active_events": 0,
            "total_teams": 0,
            "average_score": "0%"
        }

@router.patch("/institution/submissions/{submission_id}/assign-judge")
async def assign_judge_to_submission(
    submission_id: str,
    payload: dict,
    user: dict = Depends(get_auth_user),
):
    """
    Assigns a judge to a specific submission (sets ``assigned_judge_emails`` for scoped judge access).
    Body: ``judge_email`` (preferred, must match event panel) and/or ``judge_id`` (user_id; email resolved from users).
    """
    judge_id = str(payload.get("judge_id") or "").strip()
    email_raw = payload.get("judge_email") or payload.get("email")
    email = str(email_raw).strip().lower() if email_raw else ""

    sub = await submissions_col.find_one({"_id": ObjectId(submission_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    event_id = str(sub.get("event_id") or "")
    if not event_id:
        raise HTTPException(status_code=400, detail="Submission has no event_id")

    ev = await assert_institution_owns_event(event_id, user)

    resolved_uid = judge_id
    if not email and judge_id:
        judge_user = await users_col.find_one({"user_id": judge_id})
        if not judge_user and ObjectId.is_valid(judge_id):
            judge_user = await users_col.find_one({"_id": ObjectId(judge_id)})
        email = str((judge_user or {}).get("email") or "").strip().lower()
        if judge_user and not resolved_uid:
            resolved_uid = str(judge_user.get("user_id") or "")

    if email and not resolved_uid:
        acct = await users_col.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
        if acct:
            resolved_uid = str(acct.get("user_id") or "")

    if not email:
        raise HTTPException(status_code=400, detail="judge_email or judge_id (with account email) is required")

    judge_pool = {str(j.get("email") or "").strip().lower() for j in (ev.get("judges") or [])}
    if judge_pool and email not in judge_pool:
        raise HTTPException(
            status_code=400,
            detail="Judge email is not on this event's panel; add the judge to the event first.",
        )

    set_fields = {
        "assigned_judge_emails": [email],
        "status": "Under Review",
        "assigned_at": datetime.now(timezone.utc),
        "judge_assignment_at": datetime.now(timezone.utc).isoformat(),
    }
    if resolved_uid:
        set_fields["judge_id"] = resolved_uid

    res = await submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": set_fields},
    )

    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Submission not found")

    inst_id = ev.get("institution_id")
    if inst_id:
        await notify_institution(
            str(inst_id),
            f"A submission was assigned to judge {email} for \"{ev.get('title', 'event')}\".",
            ntype="judge_assigned",
            title="Judge assigned to submission",
            meta={"event_id": event_id, "submission_id": submission_id, "judge_email": email},
        )

    return {"success": True, "message": "Judge assigned successfully", "assigned_judge_emails": [email]}

@router.post("/judge/evaluate")
async def submit_evaluation(payload: dict):
    """
    Submits a judge evaluation for a submission.
    Expects: {"submission_id": "...", "judge_id": "...", "scores": {...}, "feedback": "..."}
    """
    try:
        sub_id = payload.get("submission_id")
        judge_id = payload.get("judge_id")
        scores = payload.get("scores", {})
        feedback = payload.get("feedback", "")
        
        if not sub_id or not judge_id:
            return {"error": "submission_id and judge_id are required"}, 400
            
        # 1. Calculate total score
        total_score = sum(scores.values())
        
        # 2. Update Submission status
        await db.submissions.update_one(
            {"_id": ObjectId(sub_id)},
            {"$set": {
                "status": "Evaluated",
                "score": total_score,
                "feedback": feedback,
                "evaluated_at": datetime.utcnow()
            }}
        )
        
        # 3. Save detailed evaluation record
        evaluation_record = {
            "submission_id": sub_id,
            "judge_id": judge_id,
            "scores": scores,
            "total_score": total_score,
            "feedback": feedback,
            "created_at": datetime.utcnow()
        }
        await db.evaluations.insert_one(evaluation_record)
        
        # 4. Update Team's Global Score for Leaderboard
        submission = await db.submissions.find_one({"_id": ObjectId(sub_id)})
        if submission and "team_id" in submission:
            await db.teams.update_one(
                {"_id": ObjectId(submission["team_id"])},
                {"$set": {"total_score": total_score}}
            )
            
        return {"success": True, "message": "Evaluation submitted and leaderboard updated"}
        
    except Exception as e:
        print(f"Error submitting evaluation: {str(e)}")
        return {"error": str(e)}, 500

@router.get("/institution/leaderboard/active_event")
async def get_leaderboard(event_id: Optional[str] = None):
    """
    Fetches the rankings for a specific event (or the most recent one).
    """
    from db import leaderboard_col, events_col
    try:
        query = {}
        if event_id:
            query["event_id"] = str(event_id)
        else:
            # Try to find the most recent event
            latest_event = await events_col.find_one({}, sort=[("created_at", -1)])
            if latest_event:
                query["event_id"] = str(latest_event["_id"])
            else:
                return []

        cursor = leaderboard_col.find(query).sort("rank", 1)
        rankings = await cursor.to_list(length=100)
        
        # Format for frontend
        formatted = []
        for r in rankings:
            formatted.append({
                "rank": r.get("rank", 0),
                "team_name": r.get("team_name"),
                "project_title": r.get("project_name", "Innovation Project"),
                "total_score": r.get("total_score", 0),
                "college": r.get("college", "Institution Network"),
                "criteria_scores": r.get("criteria_scores", {
                    "Innovation": min(r.get("total_score", 0), 25),
                    "Technical": min(r.get("total_score", 0), 25),
                    "UI/UX": min(r.get("total_score", 0), 25),
                    "Completeness": min(r.get("total_score", 0), 25),
                })
            })
            
        return formatted
        
    except Exception as e:
        print(f"Error fetching leaderboard: {str(e)}")
        return {"error": str(e)}, 500

@router.post("/institution/certificates/generate")
async def generate_certificates(payload: dict):
    """
    Generates certificates for the top 3 teams in the active event.
    """
    try:
        institution_id = payload.get("institution_id")
        
        # 1. Get Top 3 from leaderboard
        cursor = db.teams.find({"total_score": {"$exists": True}}).sort("total_score", -1).limit(3)
        winners = await cursor.to_list(length=3)
        
        certificates_issued = 0
        for i, team in enumerate(winners):
            category = ["Winner", "Runner Up", "Second Runner Up"][i]
            
            # Create certificate for each student in the team
            members = team.get("members", [])
            for member in members:
                cert_id = f"CERT-{datetime.utcnow().year}-{ObjectId()}"
                cert_record = {
                    "institution_id": institution_id,
                    "student_name": member.get("name"),
                    "student_email": member.get("email"),
                    "event_title": "Spring Innovation Hackathon 2026",
                    "category": category,
                    "certificate_id": cert_id,
                    "issue_date": datetime.utcnow(),
                    "verification_code": str(ObjectId())[:8].upper()
                }
                await db.certificates.insert_one(cert_record)
                certificates_issued += 1
                
        return {"success": True, "issued_count": certificates_issued}
        
    except Exception as e:
        print(f"Error generating certificates: {str(e)}")
        return {"error": str(e)}, 500

@router.get("/search")
async def global_search(q: str, institution_id: str, user: dict = Depends(get_auth_user)):
    """
    Real-time global search across events, teams, and students.
    """
    assert_institution_scope(institution_id, user)
    try:
        results = []
        query = q.lower()
        
        # 1. Smart Keyword Navigation
        if "analytic" in query or "report" in query:
            results.append({"id": "nav-analytics", "type": "Page", "title": "Reports & Analytics", "link": "/reports"})
        if "setting" in query or "profile" in query:
            results.append({"id": "nav-settings", "type": "Page", "title": "Institution Settings", "link": "/settings"})
        if "board" in query or "home" in query:
            results.append({"id": "nav-dash", "type": "Page", "title": "Main Dashboard", "link": "/"})

        # 2. Search Real Events
        event_cursor = db.events.find({"title": {"$regex": q, "$options": "i"}}).limit(3)
        async for event in event_cursor:
            results.append({
                "id": str(event["_id"]),
                "type": "Event",
                "title": event["title"],
                "link": f"/events/{event['_id']}"
            })
            
        # 3. Search Real Teams
        team_cursor = db.teams.find({"team_name": {"$regex": q, "$options": "i"}}).limit(3)
        async for team in team_cursor:
            results.append({
                "id": str(team["_id"]),
                "type": "Team",
                "title": team["team_name"],
                "link": f"/teams/{team['_id']}"
            })
            
        return results
        
    except Exception as e:
        print(f"Search API Error: {str(e)}")
        return {"error": str(e)}, 500

@router.get("/stats/{institution_id}")
async def get_institution_stats(institution_id: str, user: dict = Depends(get_auth_user)):
    """
    Fetch real-time stats for the institution dashboard.
    """
    assert_institution_scope(institution_id, user)
    try:
        # 1. Total Participants
        total_participants = await db.participants.count_documents({"institution_id": institution_id})
        
        # 2. Active Events
        active_events = await db.events.count_documents({"institution_id": institution_id, "status": "published"})
        
        # 3. Total Teams
        total_teams = await db.teams.count_documents({"institution_id": institution_id})
        
        # 4. Average Score (from evaluations)
        avg_score = 0
        pipeline = [
            {"$match": {"institution_id": institution_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$total_score"}}}
        ]
        cursor = db.submissions.aggregate(pipeline)
        async for result in cursor:
            avg_score = round(result.get("avg", 0), 1)

        return {
            "total_participants": total_participants,
            "active_events": active_events,
            "total_teams": total_teams,
            "avg_score": f"{avg_score}%"
        }
    except Exception as e:
        print(f"Stats API Error: {str(e)}")
        return {"error": str(e)}, 500

@router.get("/events-db-only/{institution_id}")
async def get_institution_events_db_only(institution_id: str, user: dict = Depends(get_auth_user)):
    """Raw `events` collection rows only (no merged opportunities). Prefer `/events/{id}` for dashboards."""
    assert_institution_scope(institution_id, user)
    try:
        cursor = db.events.find({"institution_id": institution_id})
        events = [fix_id(e) async for e in cursor]
        return events
    except Exception as e:
        return {"error": str(e)}, 500
