from fastapi import APIRouter, HTTPException, Body, Depends
from services.submission_service import create_submission, get_all_submissions, get_submission_by_id, update_submission_status
from typing import List, Optional
from routes.auth import get_current_user

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])

@router.post("/")
async def submit_project(data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        # Check if user is team leader for team submissions
        team_id = data.get("team_id")
        if team_id:
            from db import teams_col
            team = await teams_col.find_one({"_id": ObjectId(team_id)})
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
            
            team_leader_id = team.get("team_leader_id") or team.get("leader_id")
            if str(current_user.get("user_id")) != team_leader_id:
                raise HTTPException(status_code=403, detail="Only team leaders can submit projects")
        
        return await create_submission(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_submissions(event_id: Optional[str] = None, status: Optional[str] = None):
    filters = {}
    if event_id: filters["event_id"] = event_id
    if status: filters["status"] = status
    return await get_all_submissions(filters)

@router.get("/{submission_id}")
async def view_submission(submission_id: str):
    submission = await get_submission_by_id(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@router.patch("/{submission_id}/status")
async def change_status(submission_id: str, status: str = Body(embed=True)):
    return await update_submission_status(submission_id, status)

@router.get("/student-view")
async def student_view_submissions(user: dict = Depends(get_current_user)):
    """Allow students to view submissions they are part of"""
    from db import submissions_col, teams_col, participants_col
    from bson import ObjectId
    
    try:
        user_id = user.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        # Get all submissions where user is part of the team or is solo participant
        submissions = []
        
        # Check team submissions
        teams = await teams_col.find({"members.user_id": user_id}).to_list(length=None)
        for team in teams:
            team_id = str(team.get("_id"))
            team_subs = await submissions_col.find({"team_id": team_id}).to_list(length=None)
            
            # Check if user is team leader or member
            is_leader = str(user_id) == (team.get("team_leader_id") or team.get("leader_id"))
            
            for sub in team_subs:
                sub_data = dict(sub)
                sub_data["_id"] = str(sub_data["_id"])
                sub_data["access_level"] = "leader" if is_leader else "member"
                sub_data["can_view"] = True  # All team members can view
                submissions.append(sub_data)
        
        # Check solo submissions
        solo_subs = await submissions_col.find({"user_id": user_id, "team_id": {"$exists": False}}).to_list(length=None)
        for sub in solo_subs:
            sub_data = dict(sub)
            sub_data["_id"] = str(sub_data["_id"])
            sub_data["access_level"] = "owner"  # Solo participant is owner
            sub_data["can_view"] = True
            submissions.append(sub_data)
        
        return {"submissions": submissions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
