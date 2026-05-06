import smtplib
import os
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load env from root
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv(root_env)

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("email_service")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Studlyf Notifications")

import asyncio

async def send_notification_email(to_email: str, subject: str, body_html: str):
    """
    Sends an email notification. 
    Priority: 1. SMTP SSL (Port 465) - User specified SMTP only
    """
    # Skip API keys since user uses SMTP only
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM_NAME", "Studlyf Notifications")

    # --- SMTP ONLY (User specified) ---
    if not smtp_user or not smtp_pass:
        logger.error("[EMAIL ERROR] No Resend Key and no SMTP credentials found.")
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
                
                msg = MIMEMultipart()
                msg['From'] = f"{email_from} <{smtp_user}>"
                msg['to'] = to_email
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
                
                if attempt < max_retries - 1:
                    time.sleep(2)
        return False

    return await asyncio.to_thread(send_sync_email)

def get_registration_template(user_name: str, event_name: str, custom_message: str = ""):
    message_html = f"<p>{custom_message}</p><br>" if custom_message else ""
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #6C3BFF;">Registration Confirmed!</h2>
                <p>Hello <strong>{user_name}</strong>,</p>
                <p>You have successfully registered for <strong>{event_name}</strong>.</p>
                {message_html}
                <p>We are excited to see what you build! Stay tuned for further updates regarding the schedule and submission guidelines.</p>
                <br>
                <p>Best Regards,<br>Studlyf Institution Network</p>
            </div>
        </body>
    </html>
    """
