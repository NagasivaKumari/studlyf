import asyncio
import os
from dotenv import load_dotenv

# Set up environment
os.chdir(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')

from services.email_service import send_notification_email

async def test_email():
    print("Triggering test email...")
    # Using the user's email from .env as a recipient to test
    target = os.getenv("SMTP_USER") 
    subject = "Manual Test from Antigravity"
    body = "<h1>Email System Verified!</h1><p>If you see this, the fixes I made are working correctly.</p>"
    
    success = await send_notification_email(target, subject, body)
    if success:
        print(f"SUCCESS: Email sent to {target}")
    else:
        print("FAIL: Could not send email. Check SMTP logs above.")

if __name__ == "__main__":
    asyncio.run(test_email())
