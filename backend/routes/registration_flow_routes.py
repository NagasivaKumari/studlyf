from fastapi import APIRouter, HTTPException
from bson import ObjectId

from db import events_col, opportunities_col

router = APIRouter()


def _try_object_id(value: str):
    try:
        return ObjectId(value) if len(str(value)) == 24 else None
    except Exception:
        return None


async def resolve_event_id(event_id: str) -> str:
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event_id")

    obj_id = _try_object_id(event_id)

    if obj_id:
        event = await events_col.find_one({"_id": obj_id})
        if event:
            return str(event["_id"])

    event = await events_col.find_one({"event_link_id": str(event_id)})
    if event:
        return str(event["_id"])

    if obj_id:
        opportunity = await opportunities_col.find_one({"_id": obj_id})
        if opportunity:
            return str(opportunity.get("event_link_id") or opportunity.get("_id"))

    opportunity = await opportunities_col.find_one({"event_link_id": str(event_id)})
    if opportunity:
        return str(opportunity.get("event_link_id") or opportunity.get("_id"))

    raise HTTPException(status_code=404, detail="Event/Opportunity not found")
