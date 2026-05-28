import asyncio
from db import certificate_jobs_col
from datetime import datetime

async def main():
    doc = {
        "event_id": "6a103270211d257a21311d65",
        "achievement_type": "participation",
        "event_code": "HACK",
        "template_id": None,
        "status": "pending",
        "processed": 0,
        "total": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await certificate_jobs_col.insert_one(doc)
    print('Inserted job id', res.inserted_id)

if __name__ == '__main__':
    asyncio.run(main())
