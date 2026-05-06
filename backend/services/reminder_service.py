from db import events_col, judges_col, submissions_col, notifications_col, audit_logs_col, participants_col
from bson import ObjectId
from services.email_service import send_notification_email
import asyncio
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("reminder_service")

class ReminderService:
    @staticmethod
    async def send_judge_reminders():
        """
        Scans for upcoming deadlines and pings judges with pending assignments.
        Runs periodically via scheduler.
        """
        logger.info("Scanning for upcoming judging deadlines...")
        
        # 1. Find active events with deadlines in the next 24-48 hours
        now = datetime.now(timezone.utc)
        soon = now + timedelta(hours=48)
        
        active_events = []
        async for event in events_col.find({
            "submission_deadline": {"$exists": True}
        }):
            try:
                deadline = datetime.fromisoformat(event["submission_deadline"].replace('Z', '+00:00'))
                if now < deadline <= soon:
                    active_events.append(event)
            except:
                continue
                
        if not active_events:
            logger.info("No urgent judging deadlines found.")
            return

        for event in active_events:
            event_id = str(event["_id"])
            event_name = event.get("title", event.get("name", "Hackathon"))
            
            # 2. Get all submissions for this event that are 'Under Review'
            pending_submissions = []
            async for sub in submissions_col.find({
                "event_id": event_id,
                "status": "Under Review"
            }):
                pending_submissions.append(sub)
                
            if not pending_submissions:
                continue
                
            # 3. Identify unique judges who have pending work
            judges_to_remind = {} # email -> [submission_titles]
            
            for sub in pending_submissions:
                emails = sub.get("assigned_judge_emails", [])
                # If judge hasn't scored yet (check if scores exist for this judge/sub combo)
                from db import scores_col
                for email in emails:
                    score_exists = await scores_col.find_one({
                        "submission_id": str(sub["_id"]),
                        "judge_email": email
                    })
                    if not score_exists:
                        if email not in judges_to_remind:
                            judges_to_remind[email] = []
                        judges_to_remind[email].append(sub.get("project_title", "Untitled Project"))

            # 4. Send emails and in-app notifications
            for email, projects in judges_to_remind.items():
                logger.info(f"Sending reminder to judge: {email} for {len(projects)} projects")
                
                # In-app notification
                judge_user = await judges_col.find_one({"email": email, "event_id": event_id})
                if judge_user:
                    await notifications_col.insert_one({
                        "user_id": judge_user.get("user_id"), # If they are registered users
                        "email": email,
                        "type": "judge_reminder",
                        "title": "Judging Deadline Approaching",
                        "message": f'You have {len(projects)} pending evaluations for "{event_name}". Deadline: {event["submission_deadline"]}',
                        "is_read": False,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "meta": {"event_id": event_id, "project_count": len(projects)}
                    })

                # Email
                subject = f"Urgent: Judging Deadline for {event_name}"
                body = f"""
                <html>
                    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #6C3BFF;">Judging Protocol Reminder</h2>
                            <p>Hello Evaluator,</p>
                            <p>This is an automated reminder that the judging deadline for <strong>{event_name}</strong> is approaching.</p>
                            <p>Our records show you have <strong>{len(projects)}</strong> pending assessments:</p>
                            <ul>
                                {"".join([f"<li>{p}</li>" for p in projects[:5]])}
                                {f"<li>...and {len(projects)-5} more</li>" if len(projects) > 5 else ""}
                            </ul>
                            <p>Please log in to your <strong>Judge Portal</strong> to complete your evaluations.</p>
                            <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                                <strong>Deadline:</strong> {event["submission_deadline"]}
                            </div>
                            <p style="font-size: 12px; color: #999; margin-top: 40px;">
                                This is a synchronized system notification from Studlyf Engineering.
                            </p>
                        </div>
                    </body>
                </html>
                """
                asyncio.create_task(send_notification_email(email, subject, body))

    @staticmethod
    async def send_participant_reminders():
        """
        Scans for upcoming stage deadlines and pings participants who haven't submitted yet.
        """
        logger.info("Scanning for upcoming participant submission deadlines...")
        now = datetime.now(timezone.utc)
        soon = now + timedelta(hours=48)
        
        async for event in events_col.find({"status": {"$in": ["ACTIVE", "LIVE", "PUBLISHED"]}}):
            event_id = str(event["_id"])
            stages = event.get("stages", [])
            if not isinstance(stages, list): continue
            
            from services.opportunity_service import _safe_dt
            
            for stage in stages:
                if not isinstance(stage, dict): continue
                stype = str(stage.get("type") or "").upper()
                if stype != "SUBMISSION": continue
                
                end = _safe_dt(stage.get("deadline") or stage.get("endDate") or stage.get("end_date"))
                if not end: continue
                
                # Check if deadline is within the window (next 48h)
                if now < end <= soon:
                    stage_name = stage.get("name", "Submission Stage")
                    logger.info(f"Upcoming deadline for {event.get('title')}: {stage_name} at {end}")
                    
                    # Find participants in this event
                    async for p in participants_col.find({"event_id": event_id}):
                        uid = p.get("user_id")
                        if not uid: continue
                        
                        # Check if they already submitted for THIS stage
                        from db import submission_data_col
                        query = {"event_id": event_id, "stage_id": str(stage.get("id"))}
                        if p.get("team_id"):
                            query["team_id"] = p.get("team_id")
                        else:
                            query["user_id"] = uid
                            
                        sub_exists = await submission_data_col.find_one(query)
                        if not sub_exists:
                            # Send reminder!
                            email = p.get("email")
                            if email:
                                logger.info(f"Sending submission reminder to {email} for stage {stage_name}")
                                
                                # In-app notification
                                await notifications_col.insert_one({
                                    "user_id": uid,
                                    "type": "submission_reminder",
                                    "title": "Submission Deadline Approaching",
                                    "message": f'Don\'t forget to submit your work for "{stage_name}" in "{event.get("title")}". Deadline: {end.strftime("%Y-%m-%d %H:%M")}',
                                    "is_read": False,
                                    "created_at": datetime.now(timezone.utc).isoformat(),
                                    "meta": {"event_id": event_id, "stage_id": str(stage.get("id"))}
                                })
                                
                                # Email
                                subject = f"Deadline Reminder: {event.get('title')}"
                                body = f"""
                                <html>
                                    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
                                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                            <h2 style="color: #6C3BFF;">Action Required: Submission Deadline</h2>
                                            <p>Hello Participant,</p>
                                            <p>This is a reminder that the deadline for <strong>{stage_name}</strong> in <strong>{event.get('title')}</strong> is approaching.</p>
                                            <p>Our records show that your submission has not been received yet.</p>
                                            <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                                                <strong>Deadline:</strong> {end.strftime("%Y-%m-%d %H:%M")} UTC
                                            </div>
                                            <p>Please log in to Studlyf and navigate to your active hackathons to submit your deliverables before the clock runs out!</p>
                                            <p style="font-size: 12px; color: #999; margin-top: 40px;">
                                                System-generated reminder from Studlyf.
                                            </p>
                                        </div>
                                    </body>
                                </html>
                                """
                                asyncio.create_task(send_notification_email(email, subject, body))
                                
                                # Log to Audit
                                await audit_logs_col.insert_one({
                                    "action": "AUTOMATED_REMINDER_SENT",
                                    "target_user_id": uid,
                                    "target_email": email,
                                    "event_id": event_id,
                                    "stage_id": str(stage.get("id")),
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "status": "SUCCESS"
                                })

reminder_service = ReminderService()
