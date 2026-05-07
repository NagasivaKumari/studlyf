from fastapi import APIRouter, HTTPException, Depends, Body, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from db import hackathon_submissions_col, events_col, users_col, judges_col, participants_col, teams_col
from models import HackathonSubmission
from routes.auth import get_current_user

router = APIRouter(prefix="/api/hackathons", tags=["Hackathon Submissions"])

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
        doc["submissionId"] = doc["_id"]
    return doc

@router.post("/submissions")
async def create_hackathon_submission(submission: HackathonSubmission, current_user: dict = Depends(get_current_user)):
    """Create a new hackathon submission and auto-register participant/team."""
    try:
        user_id = current_user.get("user_id")
        
        # 1. Check if submission already exists for this team/user
        dup_query = {"hackathonId": submission.hackathonId}
        if submission.teamType == "Team":
            dup_query["teamName"] = submission.teamName
        else:
            dup_query["submittedBy"] = user_id
            dup_query["teamType"] = "Solo"
            
        existing = await hackathon_submissions_col.find_one(dup_query)
        if existing:
            raise HTTPException(status_code=400, detail="Team/User has already submitted for this hackathon")

        submission_dict = submission.dict(exclude={"id", "submissionId"})
        submission_dict["submittedBy"] = user_id
        submission_dict["createdAt"] = datetime.utcnow()
        submission_dict["updatedAt"] = datetime.utcnow()
        submission_dict["status"] = "Pending"
        submission_dict["totalScore"] = 0.0
        
        submission_dict["totalScore"] = 0.0
        
        # 0. Resolve target Event ID (Student might submit via Opportunity ID)
        target_event_id = submission.hackathonId
        try:
            from db import opportunities_col
            opp = await opportunities_col.find_one({"_id": ObjectId(submission.hackathonId)})
            if opp and opp.get("event_link_id"):
                target_event_id = str(opp["event_link_id"])
        except:
            pass

        # 1. Ensure Participant Record exists (for the institution dashboard)
        participant_data = {
            "user_id": user_id,
            "event_id": target_event_id,
            "institution_id": submission.institutionId,
            "registration_status": "Registered",
            "updated_at": datetime.utcnow()
        }
        
        # Try to hydrate from user profile if possible
        user_profile = await users_col.find_one({"user_id": user_id})
        if user_profile:
            participant_data["college_name"] = user_profile.get("college_name") or user_profile.get("institution_name")
            participant_data["department"] = user_profile.get("department")
            participant_data["year"] = user_profile.get("year")

        await participants_col.update_one(
            {"user_id": user_id, "event_id": target_event_id},
            {"$set": participant_data, "$setOnInsert": {"registered_at": datetime.utcnow(), "created_at": datetime.utcnow()}},
            upsert=True
        )

        # 2. Handle Team Record (if applicable)
        if submission.teamType == "Team" or submission.teamName:
            team_name = submission.teamName or f"Team {submission.teamLead}"
            team_data = {
                "event_id": target_event_id,
                "team_name": team_name,
                "team_leader_id": user_id,
                "status": "Approved",
                "updated_at": datetime.utcnow()
            }
            
            # Map members
            members = [{"user_id": user_id, "name": submission.teamLead, "role": "Lead"}]
            for m_name in (submission.teamMembers or []):
                members.append({"name": m_name, "role": "Member"})
            team_data["members"] = members

            await teams_col.update_one(
                {"team_name": team_name, "event_id": submission.hackathonId},
                {"$set": team_data, "$setOnInsert": {"formed_at": datetime.utcnow(), "created_at": datetime.utcnow()}},
                upsert=True
            )
            
            # Link participant to team
            team_doc = await teams_col.find_one({"team_name": team_name, "event_id": target_event_id})
            if team_doc:
                await participants_col.update_one(
                    {"user_id": user_id, "event_id": target_event_id},
                    {"$set": {"team_id": str(team_doc["_id"])}}
                )

        # 3. Insert the actual submission
        result = await hackathon_submissions_col.insert_one(submission_dict)
        submission_dict["_id"] = str(result.inserted_id)
        
        return fix_id(submission_dict)
    except Exception as e:
        print(f"Submission Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}/submissions")
async def get_event_submissions(
    event_id: str, 
    domain: Optional[str] = None, 
    status: Optional[str] = None, 
    judge_id: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "latest"
):
    """List all submissions for a hackathon with filters."""
    from bson import ObjectId
    from db import opportunities_col
    
    # Robust variants for the event ID
    ev_variants = [event_id, str(event_id)]
    try:
        if len(str(event_id)) == 24:
            ev_variants.append(ObjectId(event_id))
    except:
        pass
    
    # Submissions might be linked to the event ID or the opportunity ID
    linked_opp = await opportunities_col.find_one({"event_link_id": {"$in": ev_variants}})
    
    hack_ids = list(ev_variants)
    if linked_opp:
        opp_id_str = str(linked_opp["_id"])
        hack_ids.append(opp_id_str)
        try:
            hack_ids.append(ObjectId(opp_id_str))
        except:
            pass
            
    query = {"hackathonId": {"$in": hack_ids}}
    
    if domain: query["domain"] = domain
    if status: query["status"] = status
    if judge_id: query["assignedJudgeId"] = judge_id
    if search:
        query["$or"] = [
            {"teamName": {"$regex": search, "$options": "i"}},
            {"teamLead": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = hackathon_submissions_col.find(query)
    
    if sort == "highest_score":
        cursor = cursor.sort("totalScore", -1)
    elif sort == "lowest_score":
        cursor = cursor.sort("totalScore", 1)
    else:
        cursor = cursor.sort("createdAt", -1)
        
    submissions = await cursor.to_list(length=None)
    return [fix_id(s) for s in submissions]

@router.get("/institution/{institution_id}/submissions")
async def get_institution_hackathon_submissions(institution_id: str):
    """List all hackathon submissions for an institution."""
    cursor = hackathon_submissions_col.find({"institutionId": institution_id})
    cursor = cursor.sort("createdAt", -1)
    submissions = await cursor.to_list(length=None)
    return [fix_id(s) for s in submissions]

@router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str):
    """Get a specific submission by ID."""
    submission = await hackathon_submissions_col.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return fix_id(submission)

@router.patch("/submissions/assign-judge")
async def assign_judge(data: dict = Body(...)):
    """Assign a judge to multiple submissions."""
    submission_ids = data.get("submission_ids", [])
    judge_id = data.get("judge_id")
    
    if not submission_ids or not judge_id:
        raise HTTPException(status_code=400, detail="Missing submission_ids or judge_id")
    
    try:
        object_ids = [ObjectId(sid) for sid in submission_ids]
        await hackathon_submissions_col.update_many(
            {"_id": {"$in": object_ids}},
            {"$set": {"assignedJudgeId": judge_id, "status": "Assigned", "updatedAt": datetime.utcnow()}}
        )
        return {"status": "success", "message": f"Assigned judge to {len(submission_ids)} submissions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/submissions/{submission_id}/evaluate")
async def evaluate_submission(submission_id: str, data: dict = Body(...)):
    """Evaluate a submission with rubric scores."""
    rubric_scores = data.get("rubricScores", {})
    feedback = data.get("feedback", "")
    
    # Calculate total score
    total_score = sum(rubric_scores.values()) if rubric_scores else 0.0
    
    try:
        await hackathon_submissions_col.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "rubricScores": rubric_scores,
                    "totalScore": total_score,
                    "feedback": feedback,
                    "status": "Evaluated",
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return {"status": "success", "totalScore": total_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}/leaderboard")
async def get_hackathon_leaderboard(event_id: str, include_all: bool = Query(False)):
    """Get the leaderboard for a hackathon (ranked by totalScore).

    - Supports event_id that may be either the event _id or a linked opportunity _id.
    - `include_all=true` will include non-evaluated submissions (score may be 0).
    """
    from bson import ObjectId
    from db import opportunities_col

    ev_variants = [event_id, str(event_id)]
    try:
        if len(str(event_id)) == 24:
            ev_variants.append(ObjectId(event_id))
    except:
        pass

    linked_opp = await opportunities_col.find_one({"event_link_id": {"$in": ev_variants}})

    hack_ids = list(ev_variants)
    if linked_opp:
        opp_id_str = str(linked_opp["_id"])
        hack_ids.append(opp_id_str)
        try:
            hack_ids.append(ObjectId(opp_id_str))
        except:
            pass

    query = {"hackathonId": {"$in": hack_ids}}
    if not include_all:
        query["status"] = "Evaluated"

    cursor = hackathon_submissions_col.find(query).sort(
        [("totalScore", -1), ("updatedAt", -1), ("createdAt", -1)]
    )

    submissions = await cursor.to_list(length=None)
    leaderboard = []
    for i, s in enumerate(submissions):
        entry = fix_id(s)
        entry["rank"] = i + 1
        leaderboard.append(entry)

    return leaderboard

@router.get("/events/{event_id}/stats")
async def get_hackathon_stats(event_id: str):
    """Get live counters for the event page."""
    # Participants: total unique users (including team members)
    submissions = await hackathon_submissions_col.find({"hackathonId": event_id}).to_list(length=None)
    
    unique_users = set()
    for s in submissions:
        unique_users.add(s.get("submittedBy"))
        # Add team members if they are user IDs (assuming comma separated names for now as per UI, but let's see)
        # If teamMembers are names, we count them as unique entities? 
        # The user said "Participants: total unique users". 
        # Usually this means registered users.
        
    teams_count = len(submissions)
    submissions_count = len(submissions)
    
    # Wait, "Participants" logic:
    # If solo, 1. If team, count lead + members.
    total_participants = 0
    for s in submissions:
        if s.get("teamType") == "Solo":
            total_participants += 1
        else:
            # members are comma separated names
            members_str = s.get("teamMembers", "")
            if isinstance(members_str, list):
                total_participants += 1 + len(members_str)
            elif isinstance(members_str, str) and members_str.strip():
                total_participants += 1 + len([m for m in members_str.split(",") if m.strip()])
            else:
                total_participants += 1
                
    return {
        "participants": total_participants,
        "teams": teams_count,
        "submissions": submissions_count
    }

@router.get("/my-submission/{event_id}")
async def get_my_hackathon_submission(event_id: str, current_user: dict = Depends(get_current_user)):
    """Check if the current user or their team has already submitted for this hackathon."""
    user_id = current_user.get("user_id")
    
    # 1. Handle variants of the event ID
    ev_variants = [event_id]
    try:
        from bson import ObjectId
        if len(str(event_id)) == 24:
            ev_variants.append(ObjectId(event_id))
    except:
        pass
    
    # 2. Find any team this user belongs to for this event
    user_team = await teams_col.find_one({
        "event_id": {"$in": ev_variants},
        "members": user_id
    })
    
    # 3. Check for submission by user OR user's team
    query = {"hackathonId": {"$in": ev_variants}}
    conditions = [{"submittedBy": user_id}]
    if user_team:
        conditions.append({"teamName": user_team["team_name"]})
    
    query["$or"] = conditions
        
    submission = await hackathon_submissions_col.find_one(query)
    
    if not submission:
        return {"hasSubmitted": False}
    
    return {"hasSubmitted": True, "submission": fix_id(submission)}
