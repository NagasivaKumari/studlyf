from db import events_col
from models import Event
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

async def create_event(event_data: dict):
    event_data["created_at"] = datetime.utcnow()
    event_data["updated_at"] = datetime.utcnow()
    result = await events_col.insert_one(event_data)
    event_data["_id"] = str(result.inserted_id)
    return event_data

async def get_all_events(filters: dict = {}):
    cursor = events_col.find(filters)
    events = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        events.append(doc)
    return events

async def get_event_by_id(event_id: str):
    try:
        doc = await events_col.find_one({"_id": ObjectId(event_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception:
        return None

async def update_event(event_id: str, update_data: dict):
    update_data["updated_at"] = datetime.utcnow()
    await events_col.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": update_data}
    )
    return await get_event_by_id(event_id)

async def delete_event(event_id: str):
    await events_col.delete_one({"_id": ObjectId(event_id)})
    return {"message": "Event deleted successfully"}

async def update_event_status(event_id: str, status: str):
    return await update_event(event_id, {"status": status})
