from fastapi import APIRouter, HTTPException, Body, Query, Depends, File, UploadFile
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import asyncio

from auth_institution import get_auth_user
from services.opportunity_service import (
    create_opportunity,
    get_all_opportunities,
    get_opportunity_by_id,
    apply_for_opportunity,
    get_user_applications,
    get_learner_opportunity_overview,
)
from db import notifications_col
from db import quizzes_col, events_col, participants_col, opportunities_col, opportunity_applications_col
from services.email_service import send_notification_email

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

@router.post("/")
async def post_opportunity(data: dict = Body(...)):
    """API to post a new opportunity."""
    try:
        return await create_opportunity(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_opportunities(
    type: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None)
):
    """API to list opportunities with optional filters."""
    try:
        filters = {}
        if type: filters["type"] = type
        if institution_id: filters["institution_id"] = institution_id
        return await get_all_opportunities(filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/applications")
async def my_applications(user: dict = Depends(get_auth_user)):
    """Authenticated learner: all portal applications with titles and status."""
    try:
        return await get_user_applications(user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/overview")
async def my_overview(user: dict = Depends(get_auth_user), limit: int = 8):
    """Authenticated learner: upcoming deadlines + application timeline widgets."""
    try:
        return await get_learner_opportunity_overview(user["user_id"], limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/notifications")
async def my_notifications(user: dict = Depends(get_auth_user), limit: int = 40):
    """In-app notifications for the current learner (e.g. application review updates)."""
    try:
        cap = max(1, min(int(limit), 100))
        cur = notifications_col.find({"user_id": user["user_id"]}).sort("created_at", -1).limit(cap)
        items = []
        async for doc in cur:
            doc["_id"] = str(doc["_id"])
            items.append(doc)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/notifications/{notification_id}/read")
async def mark_my_notification_read(notification_id: str, user: dict = Depends(get_auth_user)):
    try:
        await notifications_col.update_one(
            {"_id": ObjectId(notification_id), "user_id": user["user_id"]},
            {"$set": {"is_read": True}},
        )
        return {"status": "ok"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification id")


@router.get("/user/{user_id}/applications")
async def list_user_applications(user_id: str, user: dict = Depends(get_auth_user)):
    """List applications for a user (self or admin only)."""
    role = str(user.get("role") or "").lower()
    if user.get("user_id") != user_id and role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        return await get_user_applications(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply")
async def apply(data: dict = Body(...)):
    """API to apply for an opportunity."""
    try:
        return await apply_for_opportunity(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{opportunity_id}")
async def view_opportunity(
    opportunity_id: str,
    applicant_user_id: Optional[str] = Query(
        None,
        description="If set, draft listings remain visible when this user has already applied.",
    ),
):
    """API to view a specific opportunity."""
    try:
        opportunity = await get_opportunity_by_id(opportunity_id, applicant_user_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return opportunity
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}/quizzes/{quiz_id}")
async def learner_view_quiz(event_id: str, quiz_id: str, user: dict = Depends(get_auth_user)):
    """Learner access to quiz with stage visibility enforcement."""
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    quiz = await quizzes_col.find_one({"_id": ObjectId(quiz_id), "event_id": str(event_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    ev = await events_col.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    if not p:
        raise HTTPException(status_code=403, detail="Register/apply first to access this quiz")

    # Visibility lock from stage config
    visibility = "Public"
    stages = ev.get("stages") if isinstance(ev.get("stages"), list) else []
    for s in stages:
        if not isinstance(s, dict):
            continue
        cfg = s.get("config") if isinstance(s.get("config"), dict) else {}
        if str(cfg.get("quiz_id") or "") == str(quiz_id):
            visibility = str(s.get("visibility") or "Public")
            break
    vis = visibility.lower()
    if vis == "private":
        raise HTTPException(status_code=403, detail="This round is private")
    if vis == "shortlisted only":
        st = str(p.get("status") or "").lower()
        if st not in ("shortlisted", "accepted"):
            raise HTTPException(status_code=403, detail="This round is only for shortlisted participants")

    # Hide answers
    q_out = []
    for q in (quiz.get("questions") or []):
        if not isinstance(q, dict):
            continue
        clean = dict(q)
        clean.pop("correctOptionIndex", None)
        q_out.append(clean)

    return {
        "_id": str(quiz["_id"]),
        "event_id": str(event_id),
        "title": quiz.get("title"),
        "duration": quiz.get("duration"),
        "pass_mark": quiz.get("pass_mark", 70),
        "questions": q_out,
    }


@router.post("/events/{event_id}/quizzes/{quiz_id}/submit")
async def learner_submit_quiz(event_id: str, quiz_id: str, payload: dict = Body(...), user: dict = Depends(get_auth_user)):
    """Learner submits quiz attempt; auto-score single-choice and queue coding for review."""
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    quiz = await quizzes_col.find_one({"_id": ObjectId(quiz_id), "event_id": str(event_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    ev = await events_col.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    if not p:
        raise HTTPException(status_code=400, detail="You must register/apply before attempting the assessment")

    answers = payload.get("answers") or []
    if not isinstance(answers, list):
        raise HTTPException(status_code=400, detail="answers must be a list")

    total, correct = 0, 0
    coding_pending = False
    coding_answers = []
    for i, q in enumerate(quiz.get("questions") or []):
        if not isinstance(q, dict):
            continue
        qtype = str(q.get("type") or "").upper()
        if qtype == "SINGLE_CHOICE":
            total += 1
            expected = q.get("correctOptionIndex")
            got = None
            if i < len(answers) and isinstance(answers[i], dict):
                got = answers[i].get("selectedIndex")
            if isinstance(expected, int) and isinstance(got, int) and expected == got:
                correct += 1
        elif qtype == "CODING":
            coding_pending = True
            if i < len(answers) and isinstance(answers[i], dict):
                coding_answers.append({"q_index": i, "code": answers[i].get("code") or "", "language": answers[i].get("language") or q.get("language")})

    score = int(round((correct / total) * 100)) if total > 0 else 0
    pass_mark = int(quiz.get("pass_mark") or 70)
    passed = (score >= pass_mark) and (not coding_pending)

    attempt = {
        "quiz_id": str(quiz_id),
        "score": score,
        "pass_mark": pass_mark,
        "passed": passed,
        "coding_pending_review": coding_pending,
        "coding_answers": coding_answers,
        "submitted_at": datetime.utcnow().isoformat(),
    }
    await participants_col.update_one({"_id": p["_id"]}, {"$push": {"quiz_attempts": attempt}, "$set": {"updated_at": datetime.utcnow()}})

    if passed:
        opp = await opportunities_col.find_one({"event_link_id": str(event_id)})
        if opp:
            await opportunity_applications_col.update_many(
                {"opportunity_id": str(opp["_id"]), "user_id": uid},
                {"$set": {"status": "shortlisted", "reviewed_at": datetime.utcnow()}},
            )
        await participants_col.update_many(
            {"event_id": str(event_id), "user_id": uid},
            {"$set": {"status": "shortlisted", "updated_at": datetime.utcnow()}},
        )
        try:
            await notifications_col.insert_one(
                {
                    "user_id": uid,
                    "type": "stage_shortlisted",
                    "message": f'You qualified for the next stage in "{ev.get("title")}".',
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "meta": {"event_id": str(event_id), "quiz_id": str(quiz_id), "score": score},
                }
            )
            em = str(user.get("email") or "").strip()
            if em:
                asyncio.create_task(
                    send_notification_email(
                        em,
                        f"Shortlisted: {ev.get('title')}",
                        f"<html><body><p>You passed the assessment (score {score}%). You are shortlisted.</p></body></html>",
                    )
                )
        except Exception:
            pass

    return {"status": "success", "score": score, "passed": passed, "coding_pending_review": coding_pending}


@router.get("/events/{event_id}/stage-submissions")
async def list_event_stage_submissions(event_id: str, user: dict = Depends(get_auth_user)):
    """
    Admin/Institution: List all stage-specific submissions (PPTs, Files, Links).
    """
    from db import submission_data_col, teams_col, users_col
    try:
        cursor = submission_data_col.find({"event_id": str(event_id)})
        items = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # Try to attach team name or user name if possible
            if doc.get("team_id"):
                team = await teams_col.find_one({"_id": ObjectId(doc["team_id"])})
                if team: doc["team_name"] = team.get("team_name")
            else:
                user_rec = await users_col.find_one({"user_id": doc["user_id"]})
                if user_rec: doc["user_name"] = user_rec.get("name")
            
            items.append(doc)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/stages/{stage_id}/upload")
async def learner_upload_stage_file(
    event_id: str, 
    stage_id: str, 
    file: UploadFile = File(...), 
    user: dict = Depends(get_auth_user)
):
    """
    Handle physical file uploads (PPT, PDF, ZIP) for a specific stage.
    """
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    from db import submission_data_col
    import os
    import uuid
    import shutil
    
    # 1. Verify participant
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    if not p:
        raise HTTPException(status_code=403, detail="Not registered for this event")

    # 2. Basic file validation
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (limit to 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size is 50MB"
        )
    
    # Check file extension
    allowed_extensions = {'.pdf', '.ppt', '.pptx', '.doc', '.docx', '.zip', '.rar', '.txt', '.jpg', '.jpeg', '.png', '.gif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_ext} is not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )

    # 3. Save file
    STAGE_UPLOADS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "stages")
    os.makedirs(STAGE_UPLOADS, exist_ok=True)
    
    unique_filename = f"{stage_id}_{uid}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(STAGE_UPLOADS, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Generate accessible URL
    file_url = f"/uploads/stages/{unique_filename}"

    # 3. Store in DB
    submission_entry = {
        "event_id": str(event_id),
        "stage_id": str(stage_id),
        "user_id": uid,
        "team_id": p.get("team_id"),
        "data": {"file_url": file_url, "filename": file.filename},
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "Submitted"
    }
    
    query = {"event_id": str(event_id), "stage_id": str(stage_id)}
    if p.get("team_id"):
        query["team_id"] = p.get("team_id")
    else:
        query["user_id"] = uid
        
    await submission_data_col.update_one(query, {"$set": submission_entry}, upsert=True)
    
    # Update participant progress
    await participants_col.update_one(
        {"_id": p["_id"]},
        {"$set": {"last_stage_submitted": stage_id, "updated_at": datetime.utcnow()}}
    )
    
    return {"status": "success", "file_url": file_url}

@router.post("/events/{event_id}/stages/{stage_id}/submit")
async def learner_submit_stage_data(
    event_id: str, 
    stage_id: str, 
    payload: dict = Body(...), 
    user: dict = Depends(get_auth_user)
):
    """
    Learner submits stage-specific data (e.g. PPT URL, GitHub Link, or Document).
    Used for SUBMISSION type stages in the hackathon pipeline.
    """
    uid = str(user.get("user_id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    from db import submission_data_col
    
    # 1. Verify event and participant
    try:
        ev_oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event id")
        
    ev = await events_col.find_one({"_id": ev_oid})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
        
    p = await participants_col.find_one({"event_id": str(event_id), "user_id": uid})
    if not p:
        raise HTTPException(status_code=403, detail="You must register/apply for this event first")

    # 2. Verify stage exists
    stages = ev.get("stages") if isinstance(ev.get("stages"), list) else []
    target_stage = None
    for s in stages:
        if str(s.get("id") or "") == stage_id:
            target_stage = s
            break
            
    if not target_stage:
        raise HTTPException(status_code=404, detail="Stage not found")
        
    # Check if stage is of type SUBMISSION
    stype = str(target_stage.get("type") or "").upper()
    if stype != "SUBMISSION":
         raise HTTPException(status_code=400, detail=f"Stage type '{stype}' does not accept manual file/link submissions")

    # 3. Validate submission data
    submission_data = payload.get("data") or {}
    if not submission_data:
        raise HTTPException(status_code=400, detail="No submission data provided")
    
    # Validate URLs if present
    for key, value in submission_data.items():
        if key.lower().endswith('_url') or key.lower() == 'url':
            if not isinstance(value, str) or not value.strip():
                raise HTTPException(status_code=400, detail=f"URL field '{key}' cannot be empty")
            # Basic URL validation
            if not (value.startswith('http://') or value.startswith('https://')):
                raise HTTPException(status_code=400, detail=f"Invalid URL format for '{key}'. Must start with http:// or https://")

    # 4. Store the submission data
    submission_entry = {
        "event_id": str(event_id),
        "stage_id": str(stage_id),
        "user_id": uid,
        "team_id": p.get("team_id"),
        "data": submission_data, # contains links, ppt_url, etc.
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "Submitted"
    }
    
    # Update existing or insert new (one submission per user/team per stage)
    query = {"event_id": str(event_id), "stage_id": str(stage_id)}
    if p.get("team_id"):
        query["team_id"] = p.get("team_id")
    else:
        query["user_id"] = uid
        
    await submission_data_col.update_one(
        query,
        {"$set": submission_entry},
        upsert=True
    )
    
    # 4. Update participant record to track progress
    await participants_col.update_one(
        {"_id": p["_id"]},
        {"$set": {"last_stage_submitted": stage_id, "updated_at": datetime.utcnow()}}
    )
    
    return {"status": "success", "message": "Stage data submitted successfully"}
