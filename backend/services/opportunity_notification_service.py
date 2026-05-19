"""
Opportunity Notification Service
Handles email notifications for opportunities:
- New opportunity posted
- Deadline reminders (3 days, 1 day)
- Daily digest of upcoming opportunities
"""

import asyncio
from datetime import datetime, timedelta
from db import db, users_col, opportunities_col, events_col, participants_col
from services.email_service import send_notification_email
from bson import ObjectId

opportunity_emails_log_col = db["opportunity_emails_log"]

async def send_new_opportunity_email(opportunity: dict, event: dict = None) -> dict:
    """
    Send immediate email to all registered students about a new opportunity.
    
    Args:
        opportunity: The opportunity document
        event: Optional event document for additional context
    
    Returns:
        dict with sent_count and failed_count
    """
    sent_count = 0
    failed_count = 0
    
    try:
        # Get all registered users (students)
        all_users = await users_col.find({"role": {"$in": ["student", "learner"]}}).to_list(length=None)
        
        opp_id = str(opportunity.get("_id", ""))
        opp_title = opportunity.get("title", "New Opportunity")
        opp_org = opportunity.get("organization", "Partner Institution")
        opp_deadline = opportunity.get("deadline")
        opp_type = opportunity.get("type", "Competition")
        
        # Format deadline
        deadline_str = "Not specified"
        if opp_deadline:
            if isinstance(opp_deadline, str):
                deadline_str = opp_deadline
            else:
                deadline_str = opp_deadline.strftime("%B %d, %Y")
        
        # Email template
        email_subject = f"🚀 New {opp_type} Opportunity: {opp_title}"
        email_body = f"""
        <html>
            <body style="font-family: system-ui, -apple-system, sans-serif; color: #111827; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900;">New Opportunity!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Don't miss out on this exciting opportunity</p>
                    </div>

                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                        <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">{opp_title}</h2>
                        <p style="margin: 0; color: #64748b; font-weight: 600;">By: {opp_org}</p>
                    </div>

                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                            <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">{opp_type}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                            <div>
                                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Deadline</p>
                                <p style="margin: 5px 0 0 0; color: #111827; font-weight: 600; font-size: 14px;">{deadline_str}</p>
                            </div>
                            <div>
                                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Posted On</p>
                                <p style="margin: 5px 0 0 0; color: #111827; font-weight: 600; font-size: 14px;">{datetime.utcnow().strftime('%B %d, %Y')}</p>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/opportunities/{opp_id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: transform 0.2s; text-transform: uppercase; letter-spacing: 0.5px;">
                            View Opportunity
                        </a>
                    </div>

                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px;">
                        <p style="margin: 0;">You're receiving this because you're registered on Studlyf. <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage preferences</a></p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Send to all students
        for user in all_users:
            try:
                email = user.get("email", "").strip()
                if email:
                    await send_notification_email(email, email_subject, email_body)
                    sent_count += 1
                    
                    # Log the email sent
                    await opportunity_emails_log_col.insert_one({
                        "opportunity_id": opp_id,
                        "user_id": user.get("user_id"),
                        "email": email,
                        "type": "new_opportunity",
                        "sent_at": datetime.utcnow(),
                        "status": "sent"
                    })
            except Exception as e:
                failed_count += 1
                print(f"Failed to send email to {user.get('email')}: {str(e)}")
        
        print(f"New opportunity emails sent: {sent_count}, failed: {failed_count}")
        return {"sent_count": sent_count, "failed_count": failed_count, "opportunity_id": opp_id}
        
    except Exception as e:
        print(f"Error in send_new_opportunity_email: {str(e)}")
        return {"sent_count": 0, "failed_count": 0, "error": str(e)}


async def send_deadline_reminder_emails(days_until: int = 3) -> dict:
    """
    Send deadline reminder emails for opportunities.
    Call this daily with days_until=3 for 3-day reminders, days_until=1 for 1-day reminders.
    
    Args:
        days_until: Days until deadline (3 or 1)
    
    Returns:
        dict with sent_count and failed_count
    """
    sent_count = 0
    failed_count = 0
    
    try:
        # Calculate date range for deadline
        now = datetime.utcnow()
        target_date = now + timedelta(days=days_until)
        
        # Get start and end of day for target_date
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Find opportunities with deadline in this range
        opportunities = await opportunities_col.find({
            "deadline": {"$gte": start_of_day, "$lte": end_of_day},
            "status": "active"
        }).to_list(length=None)
        
        for opp in opportunities:
            try:
                opp_id = str(opp.get("_id", ""))
                opp_title = opp.get("title", "Opportunity")
                opp_org = opp.get("organization", "Partner Institution")
                
                # Check if we already sent reminder for this opportunity and user combo
                # Get all registered users
                all_users = await users_col.find({"role": {"$in": ["student", "learner"]}}).to_list(length=None)
                
                for user in all_users:
                    try:
                        # Check if reminder already sent
                        already_sent = await opportunity_emails_log_col.find_one({
                            "opportunity_id": opp_id,
                            "user_id": user.get("user_id"),
                            "type": f"reminder_{days_until}d"
                        })
                        
                        if already_sent:
                            continue
                        
                        email = user.get("email", "").strip()
                        if not email:
                            continue
                        
                        # Prepare email
                        email_subject = f"⏰ Reminder: {days_until} day{'s' if days_until != 1 else ''} left to apply for {opp_title}"
                        email_body = f"""
                        <html>
                            <body style="font-family: system-ui, -apple-system, sans-serif; color: #111827; line-height: 1.6;">
                                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 900;">⏰ Time's Running Out!</h1>
                                        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Only {days_until} day{'s' if days_until != 1 else ''} left to apply</p>
                                    </div>

                                    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                                        <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">{opp_title}</h2>
                                        <p style="margin: 0; color: #64748b; font-weight: 600;">By: {opp_org}</p>
                                    </div>

                                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                            <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">
                                                📌 Deadline: {opp.get('deadline', '').strftime('%B %d, %Y at %I:%M %p') if isinstance(opp.get('deadline'), datetime) else opp.get('deadline')}
                                            </p>
                                        </div>
                                        <p style="margin: 0; color: #64748b;">Don't miss this amazing opportunity! Click the button below to apply now.</p>
                                    </div>

                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/opportunities/{opp_id}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Apply Now
                                        </a>
                                    </div>

                                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px;">
                                        <p style="margin: 0;">You're receiving this deadline reminder because you're registered on Studlyf.</p>
                                    </div>
                                </div>
                            </body>
                        </html>
                        """
                        
                        await send_notification_email(email, email_subject, email_body)
                        sent_count += 1
                        
                        # Log the reminder
                        await opportunity_emails_log_col.insert_one({
                            "opportunity_id": opp_id,
                            "user_id": user.get("user_id"),
                            "email": email,
                            "type": f"reminder_{days_until}d",
                            "sent_at": datetime.utcnow(),
                            "status": "sent"
                        })
                    except Exception as e:
                        failed_count += 1
                        print(f"Failed to send reminder to {user.get('email')}: {str(e)}")
            except Exception as e:
                print(f"Error processing opportunity {opp_id}: {str(e)}")
        
        print(f"Deadline reminder emails ({days_until}d) sent: {sent_count}, failed: {failed_count}")
        return {"sent_count": sent_count, "failed_count": failed_count, "days_until": days_until}
        
    except Exception as e:
        print(f"Error in send_deadline_reminder_emails: {str(e)}")
        return {"sent_count": 0, "failed_count": 0, "error": str(e)}


async def send_daily_digest_email() -> dict:
    """
    Send daily digest emails to all students with upcoming opportunities and deadlines.
    Call this once per day.
    
    Returns:
        dict with sent_count and failed_count
    """
    sent_count = 0
    failed_count = 0
    
    try:
        now = datetime.utcnow()
        # Get opportunities in next 7 days
        seven_days_later = now + timedelta(days=7)
        
        # Find upcoming opportunities
        upcoming_opps = await opportunities_col.find({
            "deadline": {"$gte": now, "$lte": seven_days_later},
            "status": "active"
        }).sort("deadline", 1).to_list(length=None)
        
        if not upcoming_opps:
            return {"sent_count": 0, "failed_count": 0, "message": "No upcoming opportunities"}
        
        # Get all students
        all_users = await users_col.find({"role": {"$in": ["student", "learner"]}}).to_list(length=None)
        
        for user in all_users:
            try:
                email = user.get("email", "").strip()
                if not email:
                    continue
                
                user_name = user.get("name", "Student").split()[0]  # First name
                
                # Build digest HTML
                opportunities_html = ""
                for opp in upcoming_opps:
                    deadline = opp.get("deadline")
                    if isinstance(deadline, datetime):
                        deadline_str = deadline.strftime("%b %d, %Y")
                    else:
                        deadline_str = str(deadline)
                    
                    days_left = (deadline - now).days if isinstance(deadline, datetime) else 0
                    
                    opportunities_html += f"""
                    <div style="padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">{opp.get('title', 'Opportunity')}</h3>
                            <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;">{opp.get('type', 'Competition')}</span>
                        </div>
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">{opp.get('organization', 'Partner Institution')}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-size: 12px;">📅 {deadline_str} <span style="color: #f59e0b; font-weight: 600;">({days_left}d left)</span></span>
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/opportunities/{str(opp.get('_id'))}" style="background: #667eea; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 600;">View</a>
                        </div>
                    </div>
                    """
                
                email_subject = f"📬 Daily Digest: {len(upcoming_opps)} upcoming opportunities for you"
                email_body = f"""
                <html>
                    <body style="font-family: system-ui, -apple-system, sans-serif; color: #111827; line-height: 1.6;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: 900;">📬 Daily Digest</h1>
                                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Hi {user_name}! Here are your upcoming opportunities</p>
                            </div>

                            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Opportunities in the next 7 days</h2>
                                {opportunities_html}
                            </div>

                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/opportunities" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Browse All Opportunities
                                </a>
                            </div>

                            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px;">
                                <p style="margin: 0;">You're receiving this daily digest because you're registered on Studlyf. <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage preferences</a></p>
                            </div>
                        </div>
                    </body>
                </html>
                """
                
                await send_notification_email(email, email_subject, email_body)
                sent_count += 1
                
                # Log the digest
                await opportunity_emails_log_col.insert_one({
                    "user_id": user.get("user_id"),
                    "email": email,
                    "type": "daily_digest",
                    "sent_at": datetime.utcnow(),
                    "status": "sent",
                    "opportunities_count": len(upcoming_opps)
                })
            except Exception as e:
                failed_count += 1
                print(f"Failed to send digest to {user.get('email')}: {str(e)}")
        
        print(f"Daily digest emails sent: {sent_count}, failed: {failed_count}")
        return {"sent_count": sent_count, "failed_count": failed_count, "opportunities_count": len(upcoming_opps)}
        
    except Exception as e:
        print(f"Error in send_daily_digest_email: {str(e)}")
        return {"sent_count": 0, "failed_count": 0, "error": str(e)}
