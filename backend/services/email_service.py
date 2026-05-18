import smtplib
import os
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load env from root - Force override to ensure .env updates are picked up without restart
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv(root_env, override=True)

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email_service")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Studlyf Notifications")
SMART_EMAIL_PROVIDER = os.getenv("SMART_EMAIL_PROVIDER", "smtp") # Options: resend, smtp, google
Verified_Domain_Email = os.getenv("VERIFIED_DOMAIN_EMAIL", "notifications@studlyf.com")

import asyncio

async def send_notification_email(to_email: str, subject: str, body_html: str):
    """
    Sends an email notification. 
    Priority: 1. SMTP SSL (Port 465) - User specified SMTP only
    """
    # Diagnostic logging
    logger.info(f"[EMAIL DEBUG] SMTP_SERVER: {os.getenv('SMTP_SERVER')}")
    logger.info(f"[EMAIL DEBUG] SMTP_PORT: {os.getenv('SMTP_PORT')}")
    logger.info(f"[EMAIL DEBUG] SMTP_USER: {os.getenv('SMTP_USER')[:3] if os.getenv('SMTP_USER') else 'NOT SET'}...")
    
    email_from = os.getenv("EMAIL_FROM_NAME", "Studlyf Notifications")

    # --- SMART PROVIDER LOGIC ---
    provider = os.getenv("SMART_EMAIL_PROVIDER", "smtp").lower()
    verified_from = os.getenv("VERIFIED_DOMAIN_EMAIL", "notifications@studlyf.com")
    email_from_name = os.getenv("EMAIL_FROM_NAME", "Studlyf Notifications")

    # Fallback to Resend if configured and requested
    if provider == "resend":
        resend_key = os.getenv("RESEND_API_KEY")
        if resend_key:
            try:
                import resend
                resend.api_key = resend_key
                
                params = {
                    "from": f"{email_from_name} <{verified_from}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": body_html,
                }
                
                try:
                    resend.Emails.send(params)
                except:
                    params["from"] = "Studlyf <onboarding@resend.dev>"
                    resend.Emails.send(params)
                    
                logger.info(f"[RESEND SUCCESS] Email delivered to {to_email}")
                return True
            except Exception as e:
                logger.error(f"[RESEND ERROR] Failed to send via Resend: {str(e)}")
                # Fall through to SMTP if Resend fails
    
    # Reload env inside the function to ensure we always have the absolute latest values from the file
    root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    load_dotenv(root_env, override=True)

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    smtp_user = os.getenv("SMTP_USER", "").strip().replace('"', '').replace("'", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "").replace('"', '').replace("'", "")
    
    # For Google/Custom SMTP, use the verified domain if available
    final_from_address = verified_from if "studlyf.com" in verified_from else smtp_user

    if not smtp_user or not smtp_pass:
        logger.error("[EMAIL ERROR] No SMTP credentials found.")
        return False

    def categorize_error(e: Exception) -> str:
        err_str = str(e).lower()
        if "authentication" in err_str or "login" in err_str:
            return "AUTHENTICATION_FAILURE"
        if "timeout" in err_str:
            return "CONNECTION_TIMEOUT"
        if "connection refused" in err_str:
            return "CONNECTION_REFUSED"
        if "hostname" in err_str or "dns" in err_str:
            return "DNS_RESOLUTION_FAILURE"
        if "relay" in err_str or "denied" in err_str:
            return "RELAY_DENIED"
        return "UNKNOWN_SMTP_ERROR"

    def get_domain_category(email: str) -> str:
        public_domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]
        domain = email.split("@")[-1].lower() if "@" in email else "unknown"
        return "PUBLIC_DOMAIN" if domain in public_domains else "INSTITUTIONAL_DOMAIN"

    def send_sync_email():
        max_retries = 2
        domain_cat = get_domain_category(to_email)
        
        for attempt in range(max_retries):
            start_time = time.time()
            try:
                logger.info(f"[TELEMETRY] Attempting delivery to {domain_cat} ({to_email}) | Attempt {attempt + 1}")
                
                # Force SSL for 465, else use STARTTLS
                if smtp_port == 465:
                    server = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15)
                else:
                    server = smtplib.SMTP(smtp_server, smtp_port, timeout=15)
                    server.starttls()
                    
                server.login(smtp_user, smtp_pass)
                logger.info(f"[SMTP] Logged in successfully as {smtp_user}")
                
                msg = MIMEMultipart()
                msg['From'] = f"{email_from_name} <{final_from_address}>"
                msg['To'] = to_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body_html, 'html'))
                
                server.send_message(msg)
                server.quit()
                
                duration = round(time.time() - start_time, 2)
                logger.info(f"[TELEMETRY SUCCESS] Delivered to {to_email} ({domain_cat}) in {duration}s")
                return True
            except Exception as e:
                error_cat = categorize_error(e)
                duration = round(time.time() - start_time, 2)
                logger.error(f"[TELEMETRY FAILURE] {error_cat} | Domain: {domain_cat} | Attempt: {attempt + 1} | Duration: {duration}s | Error: {str(e)}")
                # CRITICAL: Print the full stack trace for SMTP errors to help debug
                import traceback
                traceback.print_exc()
        return False

    return await asyncio.to_thread(send_sync_email)

def get_registration_template(user_name: str, event_name: str, custom_message: str = ""):
    message_html = f"<p>{custom_message}</p><br>" if custom_message else ""
    return f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background: #7C3AED; width: 60px; height: 60px; border-radius: 18px; display: inline-block; line-height: 60px; color: white; font-size: 30px; font-weight: bold;">S</div>
                </div>
                <h1 style="color: #111827; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 10px; text-transform: uppercase; tracking: 0.1em;">Registration Confirmed!</h1>
                <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">You are officially in for the journey.</p>
                <div style="background-color: #f9fafb; border-radius: 16px; padding: 25px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 14px; color: #4b5563;">Hello <strong>{user_name}</strong>,</p>
                    <p style="margin: 15px 0 0 0; font-size: 16px; color: #111827;">You have successfully registered for <strong>{event_name}</strong>.</p>
                    {message_html}
                </div>
                <p style="font-size: 14px; color: #4b5563;">Get ready to showcase your skills. Stay tuned for further updates regarding the schedule and submission guidelines.</p>
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f3f4f6; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; font-weight: bold;">Studlyf Engineering Ecosystem</p>
                </div>
            </div>
        </body>
    </html>
    """

def get_team_invite_template(leader_name: str, team_name: str, event_name: str, invite_code: str):
    # Base URL for joining - adjust as needed for production
    join_url = f"https://studlyf.com/events/join-team?code={invite_code}"
    return f"""
    <html>
        <body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background-color: #ffffff;">
                <h1 style="color: #7C3AED; font-size: 22px; font-weight: 800; text-align: center;">TEAM INVITATION</h1>
                <p style="text-align: center; color: #6b7280;">You've been handpicked to join a squad.</p>
                <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #1e1b4b;"><strong>{leader_name}</strong> has invited you to join team <strong>"{team_name}"</strong> for <strong>{event_name}</strong>.</p>
                </div>
                <div style="text-align: center;">
                    <a href="{join_url}" style="background-color: #7C3AED; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">Join the Team</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">Or use code: <strong style="color: #7C3AED;">{invite_code}</strong></p>
                </div>
                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; text-align: center;">If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
        </body>
    </html>
    """

def get_team_join_template(new_member_name: str, team_name: str, event_name: str):
    return f"""
    <html>
        <body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px;">
                <div style="text-align: center; color: #10b981; font-size: 40px; margin-bottom: 20px;">🤝</div>
                <h1 style="color: #111827; font-size: 22px; font-weight: 800; text-align: center;">NEW SQUAD MEMBER!</h1>
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <p style="margin: 0; font-size: 15px; color: #166534; text-align: center;">
                        <strong>{new_member_name}</strong> has just joined your team <strong>"{team_name}"</strong> for <strong>{event_name}</strong>.
                    </p>
                </div>
                <p style="text-align: center; color: #4b5563; font-size: 14px;">Your team is getting stronger. Head over to the Event Hub to coordinate your next moves.</p>
            </div>
        </body>
    </html>
    """

def get_shortlist_template(team_name: str, event_name: str, stage_name: str = "Next Round"):
    return f"""
    <html>
        <body style="font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f3f4f6; border-radius: 24px; background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);">
                <div style="text-align: center; margin-bottom: 20px;">🎉</div>
                <h1 style="color: #7C3AED; font-size: 28px; font-weight: 900; text-align: center; margin: 0;">CONGRATULATIONS!</h1>
                <p style="text-align: center; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; margin-top: 5px;">You've been shortlisted</p>
                
                <div style="margin: 40px 0; padding: 30px; background: white; border: 1px solid #ddd6fe; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <p style="margin: 0; font-size: 16px; color: #111827; text-align: center;">
                        Team <strong>"{team_name}"</strong> has qualified for <strong>{stage_name}</strong> in <strong>{event_name}</strong>.
                    </p>
                </div>
                
                <p style="text-align: center; color: #4b5563; font-size: 14px;">This is a significant milestone. Please check your Event Hub for updated deadlines and submission requirements for this new stage.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://studlyf.com/dashboard/learner" style="background-color: #111827; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">GO TO EVENT HUB</a>
                </div>
            </div>
        </body>
    </html>
    """

def get_certificate_template(user_name: str, event_name: str, rank: str = None, category: str = "Participant"):
    """Email template sent to participants when their certificate is issued after event finalization."""
    rank_html = f"""
        <div style="margin: 20px 0; text-align: center;">
            <span style="background: linear-gradient(135deg, #7C3AED, #9D7CFF); color: white; padding: 8px 24px; border-radius: 999px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
                🏆 Rank #{rank}
            </span>
        </div>
    """ if rank else ""

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;800&display=swap');
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #F8FAFC;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background: linear-gradient(135deg, #7C3AED 0%, #1E293B 100%); padding: 40px 30px;">
                                <div style="font-size: 40px; margin-bottom: 10px;">🎓</div>
                                <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Certificate Issued!</h1>
                                <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">{category}</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="font-size: 17px; color: #1E293B; margin: 0 0 10px 0;">Hello <strong>{user_name}</strong>,</p>
                                <p style="font-size: 15px; color: #475569; line-height: 1.8; margin: 0 0 20px 0;">
                                    Congratulations! Your official certificate for <strong>{event_name}</strong> has been issued and is now available in your Studlyf dashboard.
                                </p>

                                {rank_html}

                                <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 16px; padding: 20px; margin: 25px 0; text-align: center;">
                                    <p style="margin: 0; font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Event</p>
                                    <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 800;">{event_name}</p>
                                </div>

                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="https://studlyf.com/dashboard/learner" style="background-color: #7C3AED; color: white; padding: 16px 36px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 13px; display: inline-block; text-transform: uppercase; letter-spacing: 0.12em; box-shadow: 0 4px 15px rgba(124,58,237,0.4);">
                                        View My Certificate
                                    </a>
                                </div>

                                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 13px; color: #94A3B8; text-align: center;">
                                    This certificate was issued by the organizing institution via the Studlyf platform.
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #F8FAFC; padding: 20px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94A3B8;">Studlyf Communication Portal • 2026</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def get_announcement_template(user_name: str, event_name: str, message: str, next_stage: str = "Next Round"):
    """Flexible template for custom admin messages with placeholder support."""
    # Support dynamic placeholders in the message
    final_message = str(message)\
        .replace("{team_name}", user_name)\
        .replace("{event_name}", event_name)\
        .replace("{name}", user_name)\
        .replace("{next_stage}", next_stage)
    
    # Convert newlines to <br> for HTML
    formatted_message = final_message.replace("\n", "<br>")
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;800&display=swap');
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #F8FAFC;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <!-- Minimal Professional Header -->
                        <tr>
                            <td align="center" style="background: #1E293B; padding: 30px;">
                                <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">{event_name.upper()}</h2>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 40px;">
                                <p style="font-size: 18px; color: #1E293B; margin: 0;">Hello <strong>{user_name}</strong>,</p>
                                <div style="font-size: 16px; color: #475569; line-height: 1.8; margin: 25px 0; border-left: 4px solid #6C3BFF; padding-left: 20px;">
                                    {formatted_message}
                                </div>
                                
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 14px; color: #94A3B8;">
                                    This message was composed by the organizing team of {event_name}.
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #F8FAFC; padding: 20px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94A3B8;">Studlyf Communication Portal • 2026</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

async def send_course_purchase_email(to_email: str, student_name: str, course_name: str, amount: str, order_id: str):
    """
    Sends a high-fidelity confirmation email when a student successfully purchases a course.
    """
    subject = f"Payment Successful! Welcome to {course_name} 🚀"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #F8FAFC;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td align="center" style="background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%); padding: 40px 30px;">
                                <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Studlyf</h1>
                                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 16px;">Your learning journey begins now.</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 40px;">
                                <p style="font-size: 18px; color: #1E293B; margin: 0 0 20px 0;">Hi <strong>{student_name}</strong>,</p>
                                <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0;">
                                    Your payment was highly successful! You now have full lifetime access to <strong>{course_name}</strong>.
                                </p>
                                
                                <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; margin: 30px 0;">
                                    <h3 style="margin: 0 0 16px 0; color: #0F172A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Transaction Details</h3>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748B; font-size: 15px;">Order ID</td>
                                            <td align="right" style="padding: 8px 0; color: #0F172A; font-weight: 700; font-size: 15px;">{order_id}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748B; font-size: 15px;">Amount Paid</td>
                                            <td align="right" style="padding: 8px 0; color: #10B981; font-weight: 800; font-size: 15px;">{amount}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="https://studlyf.com/dashboard/learner" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 0.5px;">Start Learning Now</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                                <p style="margin: 0; font-size: 13px; color: #64748B;">Happy Learning! The Studlyf Team</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    await send_notification_email(to_email, subject, html_content)
