"""
Direct Evaluation Routes - No login required
Allows judges to evaluate projects directly via email links
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import secrets
import os

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])

@router.get("/{token}")
async def get_evaluation_submission(token: str):
    """Get submission details for evaluation via token"""
    from db import submission_data_col, events_col
    
    print(f"DEBUG: Evaluation API called with token: {token}")
    
    # Find submission by evaluation token (robust search: top-level or inside assigned_judges array)
    submission = await submission_data_col.find_one({
        "$or": [
            {
                "evaluation_token": token,
                "evaluation_token_expires": {"$gt": datetime.now(timezone.utc)}
            },
            {
                "assigned_judges": {
                    "$elemMatch": {
                        "evaluation_token": token
                    }
                }
            }
        ]
    })
    
    print(f"DEBUG: Found submission: {submission is not None}")
    
    if not submission:
        print(f"DEBUG: Submission not found for token: {token}")
        # Let's check if there are any submissions with evaluation tokens
        all_submissions = await submission_data_col.find({"evaluation_token": {"$exists": True}}).to_list(length=10)
        print(f"DEBUG: Submissions with evaluation tokens: {len(all_submissions)}")
        for sub in all_submissions:
            print(f"DEBUG: Token: {sub.get('evaluation_token')}, Expires: {sub.get('evaluation_token_expires')}")
        raise HTTPException(status_code=404, detail="Invalid or expired evaluation link")
    
    # Get event details
    event = await events_col.find_one({"_id": ObjectId(submission["event_id"])})
    
    # Sanitize data for judge privacy (remove student emails/names if they exist in metadata)
    sanitized_data = submission.get("data", {}).copy()
    sensitive_fields = ['user_email', 'user_name', 'email', 'contact', 'phone']
    for field in sensitive_fields:
        if field in sanitized_data:
            del sanitized_data[field]
            
    # Find the judge_id associated with this specific token
    judge_id = submission.get("assigned_judge_id")
    judge_name = "Assigned Judge"
    if "assigned_judges" in submission:
        for j in submission["assigned_judges"]:
            if j.get("evaluation_token") == token:
                judge_id = j.get("judge_id")
                judge_name = j.get("name", judge_name)
                break
    
    # Check if judge has already submitted an evaluation
    from db import scores_col
    existing_evaluation = await scores_col.find_one({
        "submission_id": str(submission["_id"]),
        "judge_id": judge_id
    })
    
    submission_data = {
        "_id": str(submission["_id"]),
        "event_id": submission.get("event_id"),
        "title": submission.get("project_name", "Untitled Project"),
        "team_name": submission.get("team_name", "Solo Participant"),
        "submitted_at": submission.get("submitted_at"),
        "status": submission.get("status"),
        "data": sanitized_data,
        "criteria": event.get("judging_criteria", []) if event else [],
        "judge_name": judge_name,
        "existing_evaluation": {
            "score": existing_evaluation.get("total_score"),
            "criteria_scores": existing_evaluation.get("criteria_scores", {}),
            "recommendation": existing_evaluation.get("recommendation"),
            "comments": existing_evaluation.get("comments"),
            "submitted_at": existing_evaluation.get("evaluated_at")
        } if existing_evaluation else None
    }
    
    return submission_data

@router.post("/{token}")
async def submit_evaluation(token: str, evaluation_data: dict = Body(...)):
    """Submit evaluation for a submission"""
    from db import submission_data_col, scores_col
    
    # Validate token (robust search: top-level or inside assigned_judges array)
    submission = await submission_data_col.find_one({
        "$or": [
            {
                "evaluation_token": token,
                "evaluation_token_expires": {"$gt": datetime.now(timezone.utc)}
            },
            {
                "assigned_judges": {
                    "$elemMatch": {
                        "evaluation_token": token
                    }
                }
            }
        ]
    })
    
    if not submission:
        raise HTTPException(status_code=404, detail="Invalid or expired evaluation link")
    
    # Extract evaluation data
    score = evaluation_data.get("score")
    recommendation = evaluation_data.get("recommendation", "")
    comments = evaluation_data.get("comments", "")
    criteria_scores = evaluation_data.get("criteria_scores", {})
    
    if not score or score < 0 or score > 100:
        raise HTTPException(status_code=400, detail="Invalid score. Must be between 0 and 100.")
    
    # Find the judge_id associated with this specific token
    judge_id = submission.get("assigned_judge_id")
    if "assigned_judges" in submission:
        for j in submission["assigned_judges"]:
            if j.get("evaluation_token") == token:
                judge_id = j.get("judge_id")
                break
    
    # Save evaluation to scores collection
    score_data = {
        "submission_id": str(submission["_id"]),
        "team_id": submission.get("team_id"), # Ensure team_id is preserved for dashboard aggregation
        "judge_id": judge_id,
        "event_id": submission["event_id"],
        "total_score": score, # Renamed to total_score for consistency with dashboard pipelines
        "criteria_scores": criteria_scores,
        "recommendation": recommendation,
        "comments": comments,
        "evaluated_at": datetime.now(timezone.utc),
        "evaluation_token": token,
        "status": "completed"
    }
    
    # Use upsert to handle accidental double-submissions with same token
    result = await scores_col.update_one(
        {"submission_id": str(submission["_id"]), "judge_id": judge_id},
        {"$set": score_data},
        upsert=True
    )
    
    # Update submission status
    await submission_data_col.update_one(
        {"_id": submission["_id"]},
        {
            "$set": {
                "evaluation_status": "completed",
                "evaluation_score": score,
                "evaluation_recommendation": recommendation,
                "evaluated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Send email notification to participant (only shortlisted/rejected status, no score)
    try:
        participant_email = submission.get("user_email") or submission.get("email") or ""
        participant_name = submission.get("user_name") or submission.get("team_name") or "Participant"
        event_title = submission.get("event_name") or submission.get("event_title") or "Event"
        is_shortlisted = recommendation == "shortlist"
        status_text = "shortlisted" if is_shortlisted else "not shortlisted"
        if participant_email:
            from services.email_service import send_notification_email
            subj = f"Update on your {event_title} submission"
            body = f"""Hello {participant_name},

Your submission for {event_title} has been reviewed.

Status: You have been {status_text} for the next stage.

{comments if comments else ''}

Best regards,
Studlyf Team"""
            await send_notification_email(participant_email, subj, body)
    except Exception as e:
        print(f"[Evaluation] Failed to send notification email: {e}")
    
    # Keep evaluation token valid for the full duration (7 days) to allow updates
    # if the judge needs to revise their evaluation.
    
    return {
        "success": True,
        "message": "Evaluation submitted successfully",
        "score_id": str(result.upserted_id) if result.upserted_id else "updated"
    }

def generate_evaluation_token():
    """Generate secure evaluation token"""
    return secrets.token_urlsafe(32)

async def create_evaluation_links(submission_id: str, judge_emails: list):
    """Create evaluation links for judges"""
    from db import submission_data_col
    
    # Generate unique token for this submission
    token = generate_evaluation_token()
    
    # Set token to expire in 7 days
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Update submission with evaluation token
    await submission_data_col.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "evaluation_token": token,
                "evaluation_token_expires": expires_at,
                "assigned_judge_emails": judge_emails
            }
        }
    )
    
    # Return evaluation URL
    base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return f"{base_url}/#/evaluate/{token}"
