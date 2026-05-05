from db import judges_col
from bson import ObjectId
from datetime import datetime, timezone

async def create_judge(data: dict):
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await judges_col.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data

async def get_all_judges():
    cursor = judges_col.find({}).sort("name", 1)
    judges = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        judges.append(doc)
    return judges

async def assign_judge_to_submission(submission_id: str, judge_id: str):
    from db import submissions_col, judges_col
    
    # Get judge details
    judge = await judges_col.find_one({"_id": ObjectId(judge_id)})
    judge_name = judge.get("full_name") or judge.get("name", "Unknown") if judge else "Unknown"
    judge_email = judge.get("email", "") if judge else ""
    
    # Get existing assigned judges
    sub = await submissions_col.find_one({"_id": ObjectId(submission_id)})
    existing_judges = sub.get("assigned_judges", []) if sub else []
    
    # Add new judge to array (avoid duplicates)
    judge_entry = {"judge_id": judge_id, "name": judge_name, "email": judge_email}
    if not any(j.get("judge_id") == judge_id for j in existing_judges):
        existing_judges.append(judge_entry)
    
    await submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "assigned_judges": existing_judges,
            "assigned_judge_id": judge_id,
            "status": "Under Review"
        }}
    )
    return True
