"""
Dynamic Submission Service - Handle stage submissions with admin-defined fields
"""

from db import submission_data_col, participants_col, events_col, users_col
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import os

async def validate_submission_data(
    event_id: str,
    stage_id: str,
    form_data: Dict[str, Any],
    required_fields: list
) -> dict:
    """Validate submission data against required fields."""
    errors = {}
    
    for field in required_fields:
        field_id = field.get("field_id")
        field_type = field.get("field_type", "text")
        is_required = field.get("required", True)
        
        value = form_data.get(field_id)
        
        # Check required
        if is_required and (value is None or value == "" or value == []):
            errors[field_id] = f"{field.get('label', field_id)} is required"
            continue
        
        # Skip validation if not required and empty
        if not is_required and (value is None or value == ""):
            continue
        
        # Type-specific validation
        if field_type == "email":
            if not isinstance(value, str) or "@" not in value:
                errors[field_id] = "Invalid email address"
        
        elif field_type == "url":
            if not isinstance(value, str) or not (value.startswith("http://") or value.startswith("https://")):
                errors[field_id] = "Invalid URL (must start with http:// or https://)"
        
        elif field_type == "number":
            try:
                float(value)
            except:
                errors[field_id] = "Must be a valid number"
        
        elif field_type == "textarea":
            if isinstance(value, str):
                max_length = field.get("max_length", 5000)
                if len(value) > max_length:
                    errors[field_id] = f"Text cannot exceed {max_length} characters (current: {len(value)})"
        
        elif field_type == "text":
            if isinstance(value, str):
                max_length = field.get("max_length", 100)
                if len(value) > max_length:
                    errors[field_id] = f"Text cannot exceed {max_length} characters"
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

async def submit_stage_data(
    event_id: str,
    stage_id: str,
    user_id: str,
    form_data: Dict[str, Any],
    team_id: Optional[str] = None
) -> dict:
    """Submit data for a stage (registration, submission, etc.)."""
    try:
        # Verify participant
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if not participant:
            return {"error": "You must register for this event first", "status": "not_registered"}
        
        # If team_id provided, verify participant is in that team
        if team_id and str(participant.get("team_id")) != str(team_id):
            return {"error": "You are not a member of this team"}
        
        # Get event and stage
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"error": "Event not found"}
        
        # Find target stage
        target_stage = None
        for stage in event.get("stages", []):
            if stage.get("id") == stage_id:
                target_stage = stage
                break
        
        if not target_stage:
            return {"error": "Stage not found"}
        
        # Check deadline
        end_date = target_stage.get("end_date") or target_stage.get("endDate") or target_stage.get("deadline")
        if end_date:
            try:
                if isinstance(end_date, str):
                    end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > end_date:
                    return {"error": "This stage deadline has passed", "status": "deadline_passed"}
            except:
                pass
        
        # Validate required fields
        fields = target_stage.get("fields", [])
        required_fields = [f for f in fields if f.get("required", True)]
        
        validation = await validate_submission_data(event_id, stage_id, form_data, required_fields)
        if not validation["valid"]:
            return {
                "status": "validation_error",
                "errors": validation["errors"],
                "message": "Please fix the errors and try again"
            }
        
        # Build submission document
        query = {"event_id": str(event_id), "stage_id": str(stage_id)}
        
        if team_id:
            query["team_id"] = str(team_id)
        else:
            query["user_id"] = str(user_id)
        
        submission_doc = {
            "event_id": str(event_id),
            "stage_id": str(stage_id),
            "stage_name": target_stage.get("name", ""),
            "stage_type": target_stage.get("type", "SUBMISSION"),
            "user_id": str(user_id),
            "team_id": str(team_id) if team_id else None,
            "data": form_data,
            "submitted_at": datetime.now(timezone.utc),
            "status": "submitted",
            "updated_at": datetime.now(timezone.utc),
        }
        
        # Upsert submission (update if exists, insert if new)
        result = await submission_data_col.update_one(
            query,
            {"$set": submission_doc},
            upsert=True
        )
        
        # Update participant's last submission
        await participants_col.update_one(
            {"_id": participant["_id"]},
            {
                "$set": {
                    "last_stage_submitted": str(stage_id),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {
            "status": "success",
            "message": f"'{target_stage.get('name')}' submitted successfully",
            "submission_id": str(result.upserted_id) if result.upserted_id else "updated",
            "data": form_data,
            "submitted_at": submission_doc["submitted_at"].isoformat(),
        }
    
    except Exception as e:
        print(f"[ERROR] submit_stage_data: {e}")
        return {"error": str(e), "status": "error"}

async def get_submission_data(
    event_id: str,
    stage_id: str,
    user_id: str,
    team_id: Optional[str] = None
) -> dict:
    """Get submission data for a stage."""
    try:
        query = {"event_id": str(event_id), "stage_id": str(stage_id)}
        
        if team_id:
            query["team_id"] = str(team_id)
        else:
            query["user_id"] = str(user_id)
        
        submission = await submission_data_col.find_one(query)
        
        if not submission:
            return {"status": "not_submitted", "data": None}
        
        return {
            "status": "found",
            "data": submission.get("data", {}),
            "submitted_at": submission.get("submitted_at"),
            "can_edit": True,  # Allow re-submission unless stage is locked
        }
    except Exception as e:
        print(f"[ERROR] get_submission_data: {e}")
        return {"error": str(e)}

async def update_profile_registration(
    user_id: str,
    event_id: str,
    registration_data: Dict[str, Any]
) -> dict:
    """Update learner profile with registration data and create/update participant."""
    try:
        # Update learner profile
        learner_profile = {
            "user_id": str(user_id),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Add registration fields to profile
        if registration_data.get("phone"):
            learner_profile["phone"] = registration_data["phone"]
        if registration_data.get("gender"):
            learner_profile["gender"] = registration_data["gender"]
        if registration_data.get("skills"):
            learner_profile["skills"] = registration_data["skills"]
        if registration_data.get("role"):
            learner_profile["role"] = registration_data["role"]
        if registration_data.get("affiliation"):
            learner_profile["affiliation"] = registration_data["affiliation"]
        
        await db["learner_profiles"].update_one(
            {"user_id": str(user_id)},
            {"$set": learner_profile},
            upsert=True
        )
        
        # Create or update participant
        participant_data = {
            "event_id": str(event_id),
            "user_id": str(user_id),
            "registration_data": registration_data,
            "registered_at": datetime.now(timezone.utc),
            "status": "registered",
            "updated_at": datetime.now(timezone.utc),
        }
        
        # Get user info
        user = await users_col.find_one({"user_id": str(user_id)})
        if user:
            participant_data["name"] = user.get("full_name", "")
            participant_data["email"] = user.get("email", "")
        
        # Get event info
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if event:
            participant_data["event_title"] = event.get("title", "")
            participant_data["institution_id"] = event.get("institution_id", "")
        
        result = await participants_col.update_one(
            {"event_id": str(event_id), "user_id": str(user_id)},
            {"$set": participant_data},
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Registration completed successfully",
            "participant_id": str(result.upserted_id) if result.upserted_id else "updated",
        }
    except Exception as e:
        print(f"[ERROR] update_profile_registration: {e}")
        return {"error": str(e)}
