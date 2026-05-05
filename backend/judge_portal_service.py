"""
Comprehensive Judge Portal Service for StudLyf Platform
Handles judge invitations, assignments, evaluations, and portal access
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from db import (
    judges_col, events_col, submissions_col, scores_col, 
    users_col, institutions_col, notifications_col, event_judges_col
)
from services.email_service import send_notification_email
from services.leaderboard_service import leaderboard_service
from notification_helpers import notify_institution
import secrets
import asyncio
import os

class JudgePortalService:
    """Service for managing judge portal operations"""
    
    async def create_judge_invitation(self, event_id: str, judge_data: dict, institution_id: str):
        """Create and send judge invitation for an event"""
        
        # Validate judge data
        required_fields = ["name", "email", "expertise"]
        for field in required_fields:
            if not judge_data.get(field):
                raise ValueError(f"Judge {field} is required")
        
        # Generate invitation token
        invitation_token = secrets.token_urlsafe(32)
        
        # Create judge record
        judge_doc = {
            "name": judge_data["name"],
            "email": judge_data["email"].lower().strip(),
            "expertise": judge_data["expertise"],
            "status": "INVITED",
            "invitation_token": invitation_token,
            "invitation_sent_at": datetime.now(timezone.utc).isoformat(),
            "event_id": event_id,
            "institution_id": institution_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "email_preferences": {
                "email_judge_assigned": True,
                "email_judge_invitation": True,
                "email_evaluation_reminder": True
            }
        }
        
        # Insert judge record
        result = await judges_col.insert_one(judge_doc)
        judge_id = str(result.inserted_id)
        
        # Create event-judge mapping
        await event_judges_col.insert_one({
            "event_id": event_id,
            "judge_id": judge_id,
            "status": "INVITED",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send invitation email
        await self._send_judge_invitation_email(judge_data, event_id, invitation_token)
        
        # Create notification for institution
        await notify_institution(
            institution_id,
            f"Invitation sent to {judge_data['name']} ({judge_data['email']}) for event judging",
            ntype="judge_invitation_sent",
            title="Judge Invitation Sent",
            meta={
                "event_id": event_id,
                "judge_name": judge_data["name"],
                "judge_email": judge_data["email"]
            }
        )
        
        return {"judge_id": judge_id, "status": "invitation_sent"}
    
    async def respond_to_invitation(self, token: str, accept: bool, user_email: str):
        """Handle judge invitation response (accept/decline)"""
        
        # Find judge by token
        judge = await judges_col.find_one({"invitation_token": token})
        if not judge:
            raise ValueError("Invalid invitation token")
        
        # Verify email matches
        if judge["email"] != user_email.lower().strip():
            raise ValueError("Email does not match invitation")
        
        # Update judge status
        new_status = "ACCEPTED" if accept else "DECLINED"
        await judges_col.update_one(
            {"_id": judge["_id"]},
            {
                "$set": {
                    "status": new_status,
                    "responded_at": datetime.now(timezone.utc).isoformat(),
                    "response_by": user_email
                }
            }
        )
        
        # Update event-judge mapping
        await event_judges_col.update_one(
            {"event_id": judge["event_id"], "judge_id": str(judge["_id"])},
            {
                "$set": {
                    "status": new_status,
                    "responded_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Get event details
        event = await events_col.find_one({"_id": ObjectId(judge["event_id"])})

        # Update the nested judge status in the events_col array for the frontend dashboard
        if event:
            await events_col.update_one(
                {"_id": ObjectId(judge["event_id"]), "judges.email": judge["email"]},
                {
                    "$set": {
                        "judges.$.status": new_status,
                        "judges.$.responded_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        # Create notification for institution
        await notify_institution(
            judge["institution_id"],
            f"{judge['name']} ({judge['email']}) has {new_status.lower()} the judging invitation",
            ntype="judge_invitation_response",
            title=f"Judge {new_status.lower()}",
            meta={
                "event_id": judge["event_id"],
                "judge_name": judge["name"],
                "judge_email": judge["email"],
                "response": new_status
            }
        )
        
        # Update user role if account exists
        if accept:
            user = await users_col.find_one({"email": judge["email"].lower().strip()})
            if user:
                await users_col.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"role": "judge"}}
                )
        
        # Send confirmation email
        await self._send_invitation_response_email(judge, event, accept)
        
        return {"status": new_status, "event_name": event.get("name", "Unknown Event") if event else "Unknown Event"}
    
    async def get_judge_assignments(self, judge_email: str, event_id: Optional[str] = None):
        """Get all submissions assigned to a judge"""
        
        # Get accepted judge records
        judge_query = {"email": judge_email.lower().strip(), "status": "ACCEPTED"}
        if event_id:
            judge_query["event_id"] = event_id
        
        judge_records = []
        async for judge in judges_col.find(judge_query):
            judge_records.append(judge)
        
        if not judge_records:
            return []
        
        # Get assigned submissions
        judge_event_ids = [judge["event_id"] for judge in judge_records]
        submission_query = {
            "event_id": {"$in": judge_event_ids},
            "status": "Submitted"
        }
        
        # Filter by assigned judge emails
        submissions = []
        async for submission in submissions_col.find(submission_query):
            assigned_judges = submission.get("assigned_judge_emails", [])
            if judge_email.lower().strip() in [j.lower().strip() for j in assigned_judges]:
                # Get event details
                event = await events_col.find_one({"_id": ObjectId(submission["event_id"])})
                
                # Get participant/team details
                participant_info = await self._get_participant_info(submission)
                
                # Get existing scores
                scores = await self._get_submission_scores(str(submission["_id"]), judge_email)
                
                submission_data = {
                    "_id": str(submission["_id"]),
                    "event_id": submission["event_id"],
                    "event_name": event.get("name", "Unknown Event") if event else "Unknown Event",
                    "title": submission.get("title", "Untitled Submission"),
                    "description": submission.get("description", ""),
                    "submitted_at": submission.get("submitted_at", ""),
                    "status": submission.get("status", "Submitted"),
                    "participant_info": participant_info,
                    "submission_data": submission.get("submission_data", {}),
                    "files": submission.get("files", []),
                    "existing_scores": scores,
                    "evaluation_criteria": event.get("judging_criteria", []) if event else []
                }
                submissions.append(submission_data)
        
        return submissions
    
    async def submit_evaluation(self, judge_email: str, submission_id: str, scores: dict, comments: str):
        """Submit evaluation for a submission"""
        
        # Validate judge assignment
        submission = await submissions_col.find_one({"_id": ObjectId(submission_id)})
        if not submission:
            raise ValueError("Submission not found")
        
        assigned_judges = submission.get("assigned_judge_emails", [])
        if judge_email.lower().strip() not in [j.lower().strip() for j in assigned_judges]:
            raise ValueError("You are not assigned to evaluate this submission")
        
        # Get judge record
        judge = await judges_col.find_one({
            "email": judge_email.lower().strip(),
            "event_id": submission["event_id"],
            "status": "ACCEPTED"
        })
        if not judge:
            raise ValueError("Judge not found or not accepted")
        
        # Submit scores
        score_doc = {
            "submission_id": submission_id,
            "judge_id": str(judge["_id"]),
            "judge_email": judge_email,
            "scores": scores,
            "comments": comments,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if already scored
        existing = await scores_col.find_one({
            "submission_id": submission_id,
            "judge_id": str(judge["_id"])
        })
        
        if existing:
            await scores_col.update_one(
                {"_id": existing["_id"]},
                {"$set": score_doc}
            )
        else:
            await scores_col.insert_one(score_doc)
        
        # Update submission status if all judges have scored
        await self._check_submission_completion(submission_id)
        
        # Update leaderboard
        await leaderboard_service.calculate_event_leaderboard(submission["event_id"])
        
        # Create notification for institution
        await notify_institution(
            submission.get("institution_id"),
            type="judge_evaluation_submitted",
            title="Evaluation Submitted",
            message=f"Judge {judge['name']} submitted evaluation for submission",
            meta={
                "event_id": submission["event_id"],
                "submission_id": submission_id,
                "judge_name": judge["name"],
                "judge_email": judge_email
            }
        )
        
        return {"status": "evaluation_submitted"}
    
    async def get_evaluation_criteria(self, event_id: str, judge_email: str):
        """Get evaluation criteria for an event"""
        
        # Verify judge is accepted for this event
        judge = await judges_col.find_one({
            "email": judge_email.lower().strip(),
            "event_id": event_id,
            "status": "ACCEPTED"
        })
        if not judge:
            raise ValueError("Judge not found or not accepted for this event")
        
        # Get event with criteria
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise ValueError("Event not found")
        
        return event.get("judging_criteria", [])
    
    async def _send_judge_invitation_email(self, judge_data: dict, event_id: str, token: str):
        """Send judge invitation email"""
        
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        event_name = event.get("name", "Unknown Event") if event else "Unknown Event"
        
        subject = f"Judge Invitation: {event_name}"
        
        # Force port 3000 for the frontend to bypass env cache issues
        base_url = "http://localhost:3000"
        invitation_link = f"{base_url}/#/judge-invitation?token={token}"
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                    <h1 style="color: #6B46C1; margin: 0; font-size: 28px;">🏆 Judge Invitation</h1>
                </div>
                
                <div style="padding: 30px 0;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>{judge_data['name']}</strong>,</p>
                    
                    <div style="background-color: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B46C1;">
                        <h3 style="color: #6B46C1; margin-top: 0;">Event Details:</h3>
                        <p style="margin: 5px 0;"><strong>Event:</strong> {event_name}</p>
                        <p style="margin: 5px 0;"><strong>Your Expertise:</strong> {judge_data['expertise']}</p>
                        <p style="margin: 5px 0;"><strong>Role:</strong> Judge/Evaluator</p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.5; margin: 20px 0;">
                        You have been invited to be a judge for this event. Your expertise is highly valued for this role.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <h4 style="margin-bottom: 15px; color: #333;">Please respond to this invitation:</h4>
                        
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="{invitation_link}&action=accept" 
                               style="background-color: #28a745; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block; 
                                      font-weight: bold; font-size: 16px; min-width: 120px;">
                                ✅ Accept Invitation
                            </a>
                            
                            <a href="{invitation_link}&action=decline" 
                               style="background-color: #dc3545; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block; 
                                      font-weight: bold; font-size: 16px; min-width: 120px;">
                                ❌ Decline Invitation
                            </a>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 14px; color: #666;">
                            Or <a href="{invitation_link}" style="color: #6B46C1;">click here to view details first</a>
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4 style="margin-top: 0; color: #856404;">What happens next?</h4>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                            <li>After accepting, you'll need to create/login to your account</li>
                            <li>You'll then access the judge portal to review assigned submissions</li>
                            <li>You can evaluate projects using our scoring system</li>
                        </ul>
                    </div>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                    <p>Best Regards,<br>Studlyf Institution Network</p>
                    <p style="font-size: 12px; margin-top: 10px;">
                        If you didn't expect this invitation, please ignore this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await send_notification_email(judge_data["email"], subject, body_html)
    
    async def _send_invitation_response_email(self, judge: dict, event: dict, accepted: bool):
        """Send invitation response confirmation email"""
        
        action = "accepted" if accepted else "declined"
        subject = f"Invitation {action.capitalize()}: {event.get('name', 'Unknown Event')}"
        
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6B46C1;">Invitation {action.capitalize()}</h2>
                <p>Hello {judge['name']},</p>
                <p>You have successfully {action} the judging invitation for: <strong>{event.get('name', 'Unknown Event')}</strong>.</p>
                {'<p>You can now access the judge portal to review assigned submissions.</p>' if accepted else '<p>Thank you for your response. We hope to collaborate in the future.</p>'}
                <p>Best Regards,<br>Studlyf Institution Network</p>
            </div>
        </body>
        </html>
        """
        
        await send_notification_email(judge["email"], subject, body_html)
    
    async def _get_participant_info(self, submission: dict) -> dict:
        """Get participant/team information for a submission"""
        
        participant_id = submission.get("participant_id")
        team_id = submission.get("team_id")
        
        if team_id:
            # Team submission
            from db import teams_col
            team = await teams_col.find_one({"_id": ObjectId(team_id)})
            if team:
                return {
                    "type": "team",
                    "name": team.get("team_name", "Unknown Team"),
                    "members": team.get("members", []),
                    "leader": team.get("leader_name", "Unknown Leader")
                }
        
        if participant_id:
            # Individual submission
            from db import participants_col
            participant = await participants_col.find_one({"_id": ObjectId(participant_id)})
            if participant:
                user = await users_col.find_one({"user_id": participant.get("user_id")})
                return {
                    "type": "individual",
                    "name": user.get("name", "Unknown Participant") if user else "Unknown Participant",
                    "email": user.get("email", "") if user else "",
                    "user_id": participant.get("user_id", "")
                }
        
        return {"type": "unknown", "name": "Unknown Participant"}
    
    async def _get_submission_scores(self, submission_id: str, judge_email: str) -> Optional[dict]:
        """Get existing scores for a submission by judge"""
        
        judge = await judges_col.find_one({"email": judge_email.lower().strip()})
        if not judge:
            return None
        
        score = await scores_col.find_one({
            "submission_id": submission_id,
            "judge_id": str(judge["_id"])
        })
        
        if score:
            return {
                "scores": score.get("scores", {}),
                "comments": score.get("comments", ""),
                "created_at": score.get("created_at", "")
            }
        
        return None
    
    async def _check_submission_completion(self, submission_id: str):
        """Check if all assigned judges have scored and update status"""
        
        submission = await submissions_col.find_one({"_id": ObjectId(submission_id)})
        if not submission:
            return
        
        assigned_judges = submission.get("assigned_judge_emails", [])
        if not assigned_judges:
            return
        
        # Count scores from assigned judges
        scored_judges = []
        async for score in scores_col.find({"submission_id": submission_id}):
            judge = await judges_col.find_one({"_id": ObjectId(score["judge_id"])})
            if judge and judge["email"] in assigned_judges:
                scored_judges.append(judge["email"])
        
        # Update status if all judges have scored
        if len(scored_judges) >= len(assigned_judges):
            await submissions_col.update_one(
                {"_id": ObjectId(submission_id)},
                {"$set": {"status": "Evaluation Complete", "evaluated_at": datetime.now(timezone.utc).isoformat()}}
            )

# Global instance
judge_portal_service = JudgePortalService()
