import asyncio
import uuid
from datetime import datetime, timedelta

from db import db, events_col

async def main():
    await db.connect()
    now = datetime.utcnow()
    event = {
        "title": "E2E Test Event",
        "description": "Automated end-to-end test event (do not deploy)",
        "status": "DRAFT",
        "institution_id": "test_institution",
        "created_at": now,
        "starts_at": now.isoformat(),
        "ends_at": (now + timedelta(days=7)).isoformat(),
        "stages": [
            {
                "id": str(uuid.uuid4()),
                "name": "Submission",
                "type": "SUBMISSION",
                "start_date": now.isoformat(),
                "end_date": (now + timedelta(days=3)).isoformat(),
                "config": {}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Review",
                "type": "REVIEW",
                "start_date": (now + timedelta(days=3)).isoformat(),
                "end_date": (now + timedelta(days=5)).isoformat(),
                "config": {}
            }
        ],
        "meta": {"created_by": "e2e-script"}
    }

    res = await events_col.insert_one(event)
    print(str(res.inserted_id))

if __name__ == '__main__':
    asyncio.run(main())
