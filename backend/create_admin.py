import firebase_admin
from firebase_admin import credentials, auth
import os
import json
from dotenv import load_dotenv

# Load explicitly from the parent directory .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def setup_admin():
    try:
        # Initialize Firebase Admin
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if not service_account_json:
            print("❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in .env")
            return

        cred_dict = json.loads(service_account_json)
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)

        email = os.getenv("ADMIN_EMAIL")
        password = os.getenv("ADMIN_PASSWORD")

        if not email or not password:
            print("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
            return

        try:
            # Check if user exists
            user = auth.get_user_by_email(email)
            print(f"🔄 User {email} exists. Updating password...")
            auth.update_user(
                user.uid,
                password=password,
                display_name="System Admin"
            )
            print(f"✅ Password successfully updated for {email}")
        except auth.UserNotFoundError:
            print(f"🆕 User {email} not found. Creating new user...")
            auth.create_user(
                email=email,
                password=password,
                display_name="System Admin"
            )
            print(f"✅ User {email} successfully created")

    except Exception as e:
        print(f"❌ Error during admin setup: {e}")

if __name__ == "__main__":
    setup_admin()
