import asyncio
import uuid
from datetime import datetime
from bson import ObjectId

from db import db, events_col, users_col, participants_col, registrations_col, submission_data_col

EVENT_ID = "6a1923bdbcdebc6f5fff4fbb"

async def main():
    await db.connect()
    # Ensure event has 3 stages
    ev = await events_col.find_one({"_id": ObjectId(EVENT_ID)})
    if not ev:
        print("EVENT_NOT_FOUND")
        return
    stages = ev.get("stages", []) or []
    if len(stages) < 3:
        from datetime import timedelta
        now = datetime.utcnow()
        # Add missing stages until 3
        while len(stages) < 3:
            idx = len(stages) + 1
            new_stage = {
                "id": str(uuid.uuid4()),
                "name": "Final" if idx == 3 else f"Stage {idx}",
                "type": "REVIEW" if idx != 1 else "SUBMISSION",
                "start_date": (now).isoformat(),
                "end_date": (now).isoformat(),
                "config": {}
            }
            stages.append(new_stage)
        await events_col.update_one({"_id": ObjectId(EVENT_ID)}, {"$set": {"stages": stages}})

    # Create or upsert test user
    user = {
        "user_id": "e2e_user_1",
        "email": "e2e.participant1@example.com",
        "full_name": "E2E Participant One",
        "role": "participant",
        "created_at": datetime.utcnow()
    }
    await users_col.update_one({"user_id": user["user_id"]}, {"$set": user}, upsert=True)

    # Create participant record
    participant = {
        "event_id": EVENT_ID,
        "user_id": user["user_id"],
        "status": "REGISTERED",
        "current_stage": stages[0]["id"],
        "registered_at": datetime.utcnow(),
        "institution_id": ev.get("institution_id")
    }
    await participants_col.update_one({"event_id": EVENT_ID, "user_id": user["user_id"]}, {"$set": participant}, upsert=True)

    # Create registration record
    registration = {
        "event_id": EVENT_ID,
        "user_id": user["user_id"],
        "status": "REGISTERED",
        "created_at": datetime.utcnow()
    }
    await registrations_col.update_one({"event_id": EVENT_ID, "user_id": user["user_id"]}, {"$set": registration}, upsert=True)

    # Create a submission_data entry for the first stage
    stage_id = stages[0]["id"]
    submission = {
        "event_id": EVENT_ID,
        "stage_id": stage_id,
        "user_id": user["user_id"],
        "status": "SUBMITTED",
        "submitted_at": datetime.utcnow(),
        "content": {"notes": "Test submission for E2E"}
    }
    await submission_data_col.update_one({"event_id": EVENT_ID, "stage_id": stage_id, "user_id": user["user_id"]}, {"$set": submission}, upsert=True)

    print("OK", user["user_id"], stage_id)

if __name__ == '__main__':
    asyncio.run(main())
