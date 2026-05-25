from fastapi import APIRouter, HTTPException
from bson import ObjectId

from db import events_col, opportunities_col

router = APIRouter()


def _try_object_id(value: str):
    try:
        return ObjectId(value) if len(str(value)) == 24 else None
    except Exception:
        return None
=======
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_exts = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".zip"}
        if file_ext not in allowed_exts:
            raise HTTPException(status_code=400, detail=f"File extension {file_ext} not allowed.")
            
        filename = f"{user['user_id']}_{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(REG_UPLOAD_DIR, filename)
        
        file_content = await file.read()
        if len(file_content) > 15 * 1024 * 1024:  # 15MB limit
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 15MB.")
            
        with open(filepath, "wb") as f:
            f.write(file_content)
            
        url = f"{BASE_URL}/uploads/registrations/{filename}"
        return {"status": "success", "url": url, "filename": file.filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
