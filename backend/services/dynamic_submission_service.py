"""
Dynamic Submission Service - Handle stage submissions with admin-defined fields
"""

from db import submission_data_col, participants_col, events_col, users_col, teams_col, opportunities_col, opportunity_applications_col
from notification_service import notification_service
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import os

async def validate_submission_data(
    event_id: str,
    stage_id: str,
    form_data: Dict[str, Any],
    required_fields: list
) -> dict:
    """Validate submission data against required fields."""
    errors = {}
    
    for field in required_fields:
        field_id = field.get("field_id")
        field_type = field.get("field_type", "text")
        is_required = field.get("required", True)
        
        value = form_data.get(field_id)
        
        # Check required
        if is_required and (value is None or value == "" or value == []):
            errors[field_id] = f"{field.get('label', field_id)} is required"
            continue
        
        # Skip validation if not required and empty
        if not is_required and (value is None or value == ""):
            continue
        
        # Type-specific validation
        if field_type == "email":
            if not isinstance(value, str) or "@" not in value:
                errors[field_id] = "Invalid email address"
        
        elif field_type == "url":
            if not isinstance(value, str) or not (value.startswith("http://") or value.startswith("https://")):
                errors[field_id] = "Invalid URL (must start with http:// or https://)"
        
        elif field_type == "number":
            try:
                float(value)
            except:
                errors[field_id] = "Must be a valid number"
        
        elif field_type == "textarea":
            if isinstance(value, str):
                max_length = field.get("max_length", 5000)
                if len(value) > max_length:
                    errors[field_id] = f"Text cannot exceed {max_length} characters (current: {len(value)})"
        
        elif field_type == "text":
            if isinstance(value, str):
                max_length = field.get("max_length", 100)
                if len(value) > max_length:
                    errors[field_id] = f"Text cannot exceed {max_length} characters"
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

async def submit_stage_data(
    event_id: str,
    stage_id: str,
    user_id: str,
    form_data: Dict[str, Any],
    team_id: Optional[str] = None
) -> dict:
    """Submit data for a stage (registration, submission, etc.)."""
    try:
        # Verify participant
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if not participant:
            # Auto-create participant if stage is public (direct submission flow)
            event = await events_col.find_one({"_id": ObjectId(event_id)})
            if event:
                target_stage = None
                for stage in event.get("stages", []):
                    if stage.get("id") == stage_id:
                        target_stage = stage
                        break
                is_public = (target_stage or {}).get("visibility", "").lower() == "public"
                if is_public:
                    user_profile = await users_col.find_one({"user_id": str(user_id)})
                    now = datetime.now(timezone.utc)
                    participant_doc = {
                        "event_id": str(event_id),
                        "institution_id": str(event.get("institution_id", "")),
                        "user_id": str(user_id),
                        "email": form_data.get("email") or (user_profile or {}).get("email", ""),
                        "name": form_data.get("name") or (user_profile or {}).get("full_name") or (user_profile or {}).get("name") or "Participant",
                        "college": form_data.get("college") or (user_profile or {}).get("college") or (user_profile or {}).get("institution", ""),
                        "phone": form_data.get("phone") or (user_profile or {}).get("phone", ""),
                        "registration_status": "Registered",
                        "status": "Active",
                        "current_stage": stage_id,
                        "registered_at": now,
                        "updated_at": now,
                    }
                    result = await participants_col.insert_one(participant_doc)
                    participant_doc["_id"] = result.inserted_id
                    participant = participant_doc
                else:
                    return {"error": "You must register for this event first", "status": "not_registered"}
            else:
                return {"error": "Event not found"}
        
        # If team_id provided, verify participant is in that team
        if team_id and str(participant.get("team_id")) != str(team_id):
            return {"error": "You are not a member of this team"}

        # (team size checks moved after fetching event)
        
        # Get event and stage
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"error": "Event not found"}
        
        # Enforce participation type
        # If team_id present, validate team size against event rules (min/max)
        if team_id:
            try:
                team = await teams_col.find_one({"_id": ObjectId(team_id)})
                members = team.get("members", []) if team else []
                # event-level team size constraints
                min_raw = event.get("minTeamSize") if event else None
                if min_raw is None and event:
                    min_raw = event.get("min_team_size")
                max_raw = event.get("maxTeamSize") if event else None
                if max_raw is None and event:
                    max_raw = event.get("max_team_size")
                if min_raw is None or max_raw is None:
                    return {"error": "Team size is not configured for this event", "status": "missing_team_size_config"}
                min_ts = int(min_raw)
                max_ts = int(max_raw)
                count = len(members) if isinstance(members, list) else 0
                if min_ts and count < min_ts:
                    return {"error": f"This team does not meet the minimum team size of {min_ts}", "status": "team_size_invalid"}
                if max_ts and count > max_ts:
                    return {"error": f"This team exceeds the maximum team size of {max_ts}", "status": "team_size_invalid"}
            except Exception:
                # ignore team size checks if teams fetch fails
                pass

        ptype = str(event.get("participationType") or "").lower().strip()
        if ptype == "individual" and team_id:
            return {"error": "This event is for individual participation only. Team submissions are not allowed.", "status": "restricted"}
        if ptype == "team" and not team_id:
            return {"error": "This event requires team participation. Please form or join a team before submitting.", "status": "restricted"}
        
        # Find target stage
        target_stage = None
        for stage in event.get("stages", []):
            if stage.get("id") == stage_id:
                target_stage = stage
                break
        
        if not target_stage:
            return {"error": "Stage not found"}
        
        # Check deadline
        end_date = target_stage.get("end_date") or target_stage.get("endDate") or target_stage.get("deadline")
        if end_date:
            try:
                if isinstance(end_date, str):
                    end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                # If parsed datetime is naive, assume UTC to enforce deadline checks consistently
                if getattr(end_date, 'tzinfo', None) is None:
                    end_date = end_date.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) > end_date:
                    return {"error": "This stage deadline has passed", "status": "deadline_passed"}
            except Exception:
                pass
        
        # Validate required fields
        fields = target_stage.get("fields", [])
        required_fields = [f for f in fields if f.get("required", True)]
        
        validation = await validate_submission_data(event_id, stage_id, form_data, required_fields)
        if not validation["valid"]:
            return {
                "status": "validation_error",
                "errors": validation["errors"],
                "message": "Please fix the errors and try again"
            }
        
        # Build submission document
        query = {"event_id": str(event_id), "stage_id": str(stage_id)}
        
        if team_id:
            query["team_id"] = str(team_id)
        else:
            query["user_id"] = str(user_id)
        
        # Check for existing submission to track changes
        existing_sub = await submission_data_col.find_one(query)
        now = datetime.now(timezone.utc)
        
        if existing_sub:
            # Prepare tracking data
            old_data = existing_sub.get("data", {})
            change_log = existing_sub.get("change_log", [])
            edit_count = existing_sub.get("edit_count", 0) + 1
            
            # Identify changes
            for field, new_value in form_data.items():
                if new_value != old_data.get(field):
                    change_log.append({
                        "timestamp": now,
                        "field": field,
                        "old_value": old_data.get(field),
                        "new_value": new_value,
                        "action": "edit"
                    })
            
            # Prepare update document
            update_doc = {
                "$set": {
                    "data": form_data,
                    "last_updated_at": now,
                    "edit_count": edit_count,
                    "change_log": change_log,
                    "status": "submitted"
                }
            }
            
            result = await submission_data_col.update_one(query, update_doc)
            submission_id = str(existing_sub.get("_id"))
            
        else:
            # New submission
            submission_doc = {
                "event_id": str(event_id),
                "institution_id": str(event.get("institution_id", "")),
                "stage_id": str(stage_id),
                "stage_name": target_stage.get("name", ""),
                "stage_type": target_stage.get("type", "SUBMISSION"),
                "submission_kind": "stage",
                "user_id": str(user_id),
                "team_id": str(team_id) if team_id else None,
                "data": form_data,
                "submitted_at": now,
                "first_submitted_at": now,
                "last_updated_at": now,
                "status": "submitted",
                "edit_count": 0,
                "change_log": []
            }
            
            result = await submission_data_col.insert_one(submission_doc)
            submission_id = str(result.inserted_id)
            
        # Update participant's last submission
        await participants_col.update_one(
            {"_id": participant["_id"]},
            {
                "$set": {
                    "last_stage_submitted": str(stage_id),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        # Auto-issuance disabled for admin-approval workflow: certificates
        # should be created only by admins via the admin UI or API.

        # Mirror submission into portal opportunity applications so it shows up in "My applications"
        mirrored = False
        mirrored_app_id = None
        try:
            # Find a mirrored opportunity linked to this event (if any)
            print(f"[DEBUG] Attempting to mirror submission for event {event_id} user {user_id}")
            opp = await opportunities_col.find_one({"event_link_id": str(event_id)})
            if opp:
                opp_id = str(opp.get("_id"))
                print(f"[DEBUG] Found opportunity {opp_id} linked to event {event_id}")
                existing = await opportunity_applications_col.find_one({"opportunity_id": opp_id, "user_id": str(user_id)})
                if not existing:
                    from datetime import datetime as _dt
                    user_profile = await users_col.find_one({"user_id": str(user_id)})
                    app_doc = {
                        "opportunity_id": opp_id,
                        "user_id": str(user_id),
                        "name": participant.get("name") or (user_profile or {}).get("full_name") or "Participant",
                        "email": participant.get("email") or (user_profile or {}).get("email") or "",
                        "applied_at": _dt.now(timezone.utc),
                        "status": "submitted",
                        "source": "submission_stage",
                    }
                    r = await opportunity_applications_col.insert_one(app_doc)
                    try:
                        mirrored_app_id = str(r.inserted_id)
                        mirrored = True
                        print(f"[DEBUG] Inserted mirrored application {mirrored_app_id} for opportunity {opp_id}")
                    except Exception as e:
                        print(f"[WARNING] Inserted mirrored application but failed to read inserted_id: {e}")
                    # Increment applicants count on opportunity
                    try:
                        await opportunities_col.update_one({"_id": opp.get("_id")}, {"$inc": {"applicantsCount": 1}})
                    except Exception as e:
                        print(f"[WARNING] Could not increment applicantsCount on opportunity {opp_id}: {e}")
                else:
                    print(f"[DEBUG] Application already exists for user {user_id} on opportunity {opp_id}")
                    mirrored = True
                    try:
                        mirrored_app_id = str(existing.get("_id"))
                    except Exception:
                        mirrored_app_id = None
            else:
                print(f"[DEBUG] No opportunity linked to event {event_id} — skipping mirror")
        except Exception as e:
            print(f"[WARNING] Could not mirror submission to opportunity applications: {e}")
        
        # Create/update opportunity application so it shows in "My Applications"
        try:
            opp = await opportunities_col.find_one({"event_link_id": str(event_id)})
            if opp:
                await opportunity_applications_col.update_one(
                    {"opportunity_id": str(opp["_id"]), "user_id": str(user_id)},
                    {"$set": {
                        "opportunity_id": str(opp["_id"]),
                        "user_id": str(user_id),
                        "status": "submitted",
                        "submitted_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc),
                        "stage_id": str(stage_id),
                        "event_id": str(event_id),
                    }},
                    upsert=True
                )
        except Exception as e:
            print(f"[WARN] Failed to sync opportunity application: {e}")
            # Create notification for user and institution admins (if any)
            try:
                # Notify submitting user
                title = f"Submission received: {target_stage.get('name')}"
                message = f"Your submission for '{target_stage.get('name')}' has been received. You can view it in My Applications or on the Event page."
                await notification_service.create_notification(
                    user_id=str(user_id),
                    notification_type="submission",
                    title=title,
                    message=message,
                    metadata={"stage_id": stage_id, "event_id": str(event_id)},
                    institution_id=str(event.get("institution_id")) if event else None,
                    event_id=str(event_id)
                )
            except Exception as e:
                print(f"[WARN] Could not create submission notification: {e}")
        
        return {
            "status": "success",
            "message": f"'{target_stage.get('name')}' submitted successfully",
            "submission_id": str(result.upserted_id) if result.upserted_id else "updated",
            "data": form_data,
            "submitted_at": submission_doc["submitted_at"].isoformat(),
            "mirrored_application": mirrored,
            "mirrored_application_id": mirrored_app_id,
        }
    
    except Exception as e:
        print(f"[ERROR] submit_stage_data: {e}")
        return {"error": str(e), "status": "error"}

async def get_submission_data(
    event_id: str,
    stage_id: str,
    user_id: str,
    team_id: Optional[str] = None
) -> dict:
    """Get submission data for a stage."""
    try:
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"status": "error", "error": "Event not found"}

        target_stage = None
        for stage in event.get("stages", []):
            if stage.get("id") == stage_id:
                target_stage = stage
                break

        query = {"event_id": str(event_id), "stage_id": str(stage_id)}
        
        if team_id:
            query["team_id"] = str(team_id)
        else:
            query["user_id"] = str(user_id)
        
        submission = await submission_data_col.find_one(query)
        
        if not submission:
            can_edit = True
            if target_stage:
                end_date = target_stage.get("end_date") or target_stage.get("endDate") or target_stage.get("deadline")
                if end_date:
                    try:
                        if isinstance(end_date, str):
                            end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                        if datetime.now(timezone.utc) > end_date:
                            can_edit = False
                    except Exception:
                        pass
            return {"status": "not_submitted", "data": None, "can_edit": can_edit}

        can_edit = True
        if target_stage:
            end_date = target_stage.get("end_date") or target_stage.get("endDate") or target_stage.get("deadline")
            if end_date:
                try:
                    if isinstance(end_date, str):
                        end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                    # Normalize naive datetimes to UTC for consistent comparison
                    if getattr(end_date, 'tzinfo', None) is None:
                        end_date = end_date.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) > end_date:
                        can_edit = False
                except Exception:
                    pass
        
        return {
            "status": "found",
            "data": submission.get("data", {}),
            "submitted_at": submission.get("submitted_at"),
            "can_edit": can_edit,
        }
    except Exception as e:
        print(f"[ERROR] get_submission_data: {e}")
        return {"error": str(e)}

async def update_profile_registration(
    user_id: str,
    event_id: str,
    registration_data: Dict[str, Any]
) -> dict:
    """Update learner profile with registration data and create/update participant."""
    try:
        # Update learner profile
        learner_profile = {
            "user_id": str(user_id),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Add registration fields to profile
        if registration_data.get("phone"):
            learner_profile["phone"] = registration_data["phone"]
        if registration_data.get("gender"):
            learner_profile["gender"] = registration_data["gender"]
        if registration_data.get("skills"):
            learner_profile["skills"] = registration_data["skills"]
        if registration_data.get("role"):
            learner_profile["role"] = registration_data["role"]
        if registration_data.get("affiliation"):
            learner_profile["affiliation"] = registration_data["affiliation"]
        
        await db["learner_profiles"].update_one(
            {"user_id": str(user_id)},
            {"$set": learner_profile},
            upsert=True
        )
        
        # Create or update participant
        participant_data = {
            "event_id": str(event_id),
            "user_id": str(user_id),
            "registration_data": registration_data,
            "registered_at": datetime.now(timezone.utc),
            "status": "registered",
            "updated_at": datetime.now(timezone.utc),
        }
        
        # Get user info
        user = await users_col.find_one({"user_id": str(user_id)})
        if user:
            participant_data["name"] = user.get("full_name", "")
            participant_data["email"] = user.get("email", "")
        
        # Get event info
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if event:
            participant_data["event_title"] = event.get("title", "")
            participant_data["institution_id"] = event.get("institution_id", "")
        
        result = await participants_col.update_one(
            {"event_id": str(event_id), "user_id": str(user_id)},
            {"$set": participant_data},
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Registration completed successfully",
            "participant_id": str(result.upserted_id) if result.upserted_id else "updated",
        }
    except Exception as e:
        print(f"[ERROR] update_profile_registration: {e}")
        return {"error": str(e)}
