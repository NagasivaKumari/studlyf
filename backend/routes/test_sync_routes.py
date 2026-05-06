"""
Test Routes - Debug stage synchronization issues
"""
from fastapi import APIRouter
from db import events_col, opportunities_col

router = APIRouter(prefix="/api/test", tags=["Test"])

@router.get("/sync-status/{event_id}")
async def test_sync_status(event_id: str):
    """Test sync status between event and opportunities"""
    try:
        # Get event
        event = await events_col.find_one({"_id": event_id})
        if not event:
            return {"error": "Event not found"}
        
        # Get opportunities with different field names
        opp_by_event_link_id = await opportunities_col.find({"event_link_id": event_id}).to_list()
        opp_by_event_id = await opportunities_col.find({"event_id": event_id}).to_list()
        opp_by_id = await opportunities_col.find({"_id": event_id}).to_list()
        
        return {
            "event_id": event_id,
            "event_name": event.get("name", "Unknown"),
            "event_stages_count": len(event.get("stages", [])),
            "event_stages": event.get("stages", []),
            "opportunities": {
                "by_event_link_id": {
                    "count": len(opp_by_event_link_id),
                    "items": [{"id": str(opp["_id"]), "title": opp.get("title", "Unknown"), "stages_count": len(opp.get("stages", []))} for opp in opp_by_event_link_id]
                },
                "by_event_id": {
                    "count": len(opp_by_event_id),
                    "items": [{"id": str(opp["_id"]), "title": opp.get("title", "Unknown"), "stages_count": len(opp.get("stages", []))} for opp in opp_by_event_id]
                },
                "by_id": {
                    "count": len(opp_by_id),
                    "items": [{"id": str(opp["_id"]), "title": opp.get("title", "Unknown"), "stages_count": len(opp.get("stages", []))} for opp in opp_by_id]
                }
            }
        }
    except Exception as e:
        return {"error": str(e)}
