from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from db import participants_col, submissions_col, leaderboard_col, events_col, institutions_col

router = APIRouter(prefix="/api/upgrades", tags=["Pro Upgrades"])

# ─── VARSHINI: ADMIN ANALYTICS ───
@router.get("/heatmap/{institution_id}")
async def get_registration_heatmap(institution_id: str):
    try:
        pipeline = [
            {"$match": {"institution_id": institution_id}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$registered_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        return {"heatmap": await participants_col.aggregate(pipeline).to_list(None)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demographics/{institution_id}")
async def get_demographics(institution_id: str):
    try:
        pipeline = [
            {"$match": {"institution_id": institution_id}},
            {"$group": {"_id": "$department", "count": {"$sum": 1}}}
        ]
        return {"demographics": await participants_col.aggregate(pipeline).to_list(None)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── SRAVANTHI: PUBLIC & REGISTRATION ───
@router.post("/resume-autofill")
async def resume_autofill(file: UploadFile = File(...)):
    # AI Resume Parsing logic (Mocked)
    return {
        "name": "Nagasiva Kumari",
        "email": "nagasiva@example.com",
        "skills": ["React", "FastAPI", "MongoDB"],
        "college": "St. Peters Engineering College"
    }

@router.get("/matchmaker/{user_id}")
async def get_recommended_teammates(user_id: str):
    return [
        {"user_id": "u2", "name": "Akshay", "match_score": "95%", "missing_skills": ["UI/UX"]},
        {"user_id": "u3", "name": "Sravanthi", "match_score": "88%", "missing_skills": ["DevOps"]}
    ]

# ─── NITHYA: JUDGING & SUBMISSIONS ───
@router.get("/blind-submissions/{event_id}")
async def get_blind_submissions(event_id: str):
    try:
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        is_blind = event.get("is_blind_judging", False) if event else False
        subs = await submissions_col.find({"event_id": event_id}).to_list(None)
        for s in subs:
            s["_id"] = str(s["_id"])
            if is_blind:
                s.pop("participant_id", None)
                s.pop("team_id", None)
                # Use actual team name if available, otherwise use masked identity
                team_name = s.get("team_name") or s.get("user_name") or s.get("title") or "Team"
                s["masked_identity"] = f"{team_name}_{s['_id'][-4:]}"

        return {"submissions": subs, "is_blind_mode": is_blind}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plagiarism-check/{submission_id}")
async def check_plagiarism(submission_id: str):
    return {"status": "success", "similarity_score": 12, "flag": "LOW_RISK"}

# ─── AKSHAY: LEADERBOARD TICKER ───
@router.get("/leaderboard-ticker/{event_id}")
async def get_live_ticker(event_id: str):
    try:
        top = await leaderboard_col.find({"event_id": event_id}).sort("rank", 1).limit(5).to_list(None)
        ticker_text = " | ".join([f"#{e['rank']} {e.get('team_name', 'User')} ({e['total_score']} pts)" for e in top])
        return {"ticker": ticker_text}
    except Exception:
        return {"ticker": "Leaderboard updating live..."}

# ─── NAGASIVA: BACKBONE UPGRADES ───
@router.post("/update-stats/{institution_id}")
async def trigger_stats_update(institution_id: str):
    try:
        total_events = await events_col.count_documents({"institution_id": institution_id})
        total_participants = await participants_col.count_documents({"institution_id": institution_id})
        stats = {
            "total_events": total_events,
            "total_participants": total_participants,
            "last_updated": datetime.utcnow().isoformat()
        }
        await institutions_col.update_one({"_id": institution_id}, {"$set": {"cached_stats": stats}})
        return {"status": "success", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
