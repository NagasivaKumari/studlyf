from fastapi import APIRouter, HTTPException, Body, Depends
from services.event_service import (
    create_event,
    get_all_events,
    get_event_by_id,
    update_event,
    delete_event,
    update_event_status
)
from typing import List, Optional
from auth_institution import get_auth_user
from bson import ObjectId

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.post("/")
async def post_event(data: dict = Body(...)):
    try:
        return await create_event(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_events(status: Optional[str] = None, institution_id: Optional[str] = None):
    filters = {}
    if status: filters["status"] = status
    if institution_id: filters["institution_id"] = institution_id
    return await get_all_events(filters)

@router.get("/{event_id}")
async def view_event(event_id: str):
    event = await get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}")
async def modify_event(event_id: str, data: dict = Body(...)):
    return await update_event(event_id, data)

@router.delete("/{event_id}")
async def remove_event(event_id: str):
    return await delete_event(event_id)

@router.patch("/{event_id}/status")
async def change_event_status(event_id: str, status: str = Body(embed=True)):
    return await update_event_status(event_id, status)

@router.get("/{event_id}/hub")
async def get_event_hub_data(event_id: str, user: dict = Depends(get_auth_user)):
    from db import participants_col, teams_col
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    team = None
    if p and p.get("team_id"):
        try:
            team = await teams_col.find_one({"_id": ObjectId(str(p.get("team_id")))})
        except Exception:
            team = None
            
    if p:
        p["_id"] = str(p["_id"])
        # Standardize fields for frontend
        p = {
            "_id": p["_id"],
            "event_id": p.get("event_id"),
            "user_id": p.get("user_id"),
            "team_id": p.get("team_id"),
            "status": p.get("status", "pending"),
            "current_stage": p.get("current_stage"),
            "last_stage_submitted": p.get("last_stage_submitted")
        }
        
    if team:
        team["_id"] = str(team["_id"])
        # Stringify leader_id for frontend comparison (EventHub.tsx:265)
        if "leader_id" in team:
            team["leader_id"] = str(team["leader_id"])
        if "team_leader_id" in team:
            team["team_leader_id"] = str(team["team_leader_id"])
            # Map team_leader_id to leader_id for compatibility with EventHub.tsx
            if "leader_id" not in team:
                team["leader_id"] = team["team_leader_id"]
                
        if "members" in team:
            # Enrich team members with user details
            from db import users_col
            member_user_ids = [str(m.get("user_id")) for m in team["members"] if m.get("user_id")]
            users = {}
            if member_user_ids:
                cursor = users_col.find({"user_id": {"$in": member_user_ids}})
                async for user_doc in cursor:
                    users[str(user_doc["user_id"])] = {
                        "name": user_doc.get("name", ""),
                        "email": user_doc.get("email", "")
                    }
            
            for m in team["members"]:
                if "user_id" in m:
                    user_id = str(m["user_id"])
                    m["user_id"] = user_id
                    # Add user details
                    if user_id in users:
                        m["name"] = users[user_id]["name"]
                        m["email"] = users[user_id]["email"]
                    else:
                        m["name"] = "Unknown User"
                        m["email"] = ""
                    # Set leader flag
                    m["is_leader"] = str(m.get("role", "MEMBER")) == "LEADER" or user_id == str(team.get("leader_id", ""))
                    
    # Check for existing evaluations (to lock submissions)
    from db import scores_col, submissions_col
    is_evaluated = False
    evaluation_data = {}
    if p:
        # Check submissions_col first for the new judging system results
        sub_query = {"event_id": str(event_id)}
        if p.get("team_id"):
            sub_query["team_id"] = str(p["team_id"])
        else:
            sub_query["user_id"] = uid
            
        latest_sub = await submissions_col.find_one(sub_query, sort=[("submitted_at", -1)])
        if latest_sub and latest_sub.get("status") == "Evaluated":
            is_evaluated = True
            evaluation_data = {
                "score": latest_sub.get("total_score"),
                "feedback": latest_sub.get("evaluator_feedback"),
                "evaluated_at": latest_sub.get("evaluated_at")
            }
        else:
            # Fallback to legacy scores_col
            score_query = {"event_id": str(event_id)}
            if p.get("team_id"):
                score_query["team_id"] = str(p["team_id"])
            else:
                score_query["user_id"] = uid
            
            legacy_score = await scores_col.find_one(score_query)
            if legacy_score:
                is_evaluated = True
                evaluation_data = {
                    "score": legacy_score.get("total_score"),
                    "feedback": legacy_score.get("comments"),
                    "evaluated_at": legacy_score.get("evaluated_at")
                }

    return {
        "participant": p, 
        "team": team, 
        "is_evaluated": is_evaluated,
        "evaluation": evaluation_data
    }
