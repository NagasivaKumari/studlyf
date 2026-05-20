"""
Registration Service - Auto-fill user profile data and merge with event-specific fields
Implements Unstop-like registration with pre-filled profile data
"""

from db import users_col, participants_col, events_col, submission_data_col
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import re

async def get_user_profile_data(user_id: str) -> Dict[str, Any]:
    """Fetch user profile data (name, email, college, etc.) for auto-fill."""
    try:
        user = await users_col.find_one({"user_id": str(user_id)})
        if not user:
            return {}
        
        profile_data = {
            "full_name": user.get("full_name", ""),
            "name": user.get("name", "") or user.get("full_name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "college": user.get("college", "") or user.get("institution", ""),
            "institution": user.get("institution", "") or user.get("college", ""),
            "gender": user.get("gender", ""),
            "skills": user.get("skills", []),
        }
        
        return profile_data
    except Exception as e:
        print(f"[ERROR] get_user_profile_data: {e}")
        return {}

async def classify_registration_fields(
    fields: List[Dict[str, Any]],
    user_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Classify registration fields into:
    - prefilled: Fields that can be auto-filled from user profile
    - custom: Fields specific to this event that need user input
    
    Returns a mapping with field classifications and prefilled values.
    """
    prefill_mapping = {
        "name": ["full name", "name", "your name", "student name", "participant name"],
        "email": ["email", "email address", "your email"],
        "phone": ["phone", "phone number", "mobile", "contact number", "phone no"],
        "college": ["college", "university", "institution", "school", "institution name", "college name"],
        "gender": ["gender", "sex", "choose your gender"],
        "skills": ["skills", "technical skills", "expertise", "your skills"],
    }
    
    classified = {
        "prefilled": [],
        "custom": [],
        "prefilled_values": {}
    }
    
    for field in fields:
        field_label = (field.get("label", "") or "").lower().strip()
        field_type = (field.get("type", "") or "").lower().strip()
        field_id = field.get("id", "")
        
        # Check if this field can be prefilled
        is_prefillable = False
        prefill_key = None
        
        for profile_key, keywords in prefill_mapping.items():
            if any(keyword in field_label for keyword in keywords):
                is_prefillable = True
                prefill_key = profile_key
                break
        
        field_info = {
            "id": field_id,
            "label": field.get("label", ""),
            "type": field_type,
            "required": field.get("required", False),
            "hint": field.get("hint", ""),
            "options": field.get("options", []),
        }
        
        if is_prefillable and prefill_key and user_profile.get(prefill_key):
            # This can be prefilled
            field_info["prefilled"] = True
            field_info["prefilled_value"] = user_profile.get(prefill_key)
            classified["prefilled"].append(field_info)
            classified["prefilled_values"][field_id] = user_profile.get(prefill_key)
        else:
            # This is custom/event-specific
            field_info["prefilled"] = False
            classified["custom"].append(field_info)
    
    return classified

async def merge_registration_data(
    user_id: str,
    event_id: str,
    registration_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Merge user profile data with registration form data.
    Adds prefilled profile data to the registration automatically.
    
    Returns the complete registration data with both prefilled and custom fields.
    """
    try:
        # Get user profile
        user_profile = await get_user_profile_data(user_id)
        
        # Get event to check registration fields
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"error": "Event not found"}
        
        registration_fields = event.get("registrationFields", [])
        
        # Classify fields
        field_classification = await classify_registration_fields(
            registration_fields,
            user_profile
        )
        
        # Build complete registration data
        merged_data = {
            **registration_data,  # Include all custom field answers
            **field_classification["prefilled_values"]  # Add prefilled values
        }
        
        # Extract name and email for participant record
        name = merged_data.get("name") or merged_data.get("full_name") or user_profile.get("full_name") or "Anonymous"
        email = merged_data.get("email") or user_profile.get("email") or "unknown@participant.local"
        
        return {
            "status": "success",
            "merged_data": merged_data,
            "prefilled_count": len(field_classification["prefilled"]),
            "custom_count": len(field_classification["custom"]),
            "participant_name": name,
            "participant_email": email,
            "user_profile": user_profile,
        }
    except Exception as e:
        print(f"[ERROR] merge_registration_data: {e}")
        return {"error": str(e)}

async def complete_registration(
    event_id: str,
    user_id: str,
    registration_data: Dict[str, Any],
    institution_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Complete event registration with auto-filled profile data.
    Creates/updates participant record with merged data.
    """
    try:
        # Merge profile data with registration data
        merge_result = await merge_registration_data(user_id, event_id, registration_data)
        
        if "error" in merge_result:
            return merge_result
        
        merged_data = merge_result["merged_data"]
        name = merge_result["participant_name"]
        email = merge_result["participant_email"]
        
        # Get event info
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"error": "Event not found"}

        # Determine first stage from event stages to set as current_stage
        event_stages = event.get("stages", [])
        first_stage_name = None
        if event_stages and isinstance(event_stages, list) and len(event_stages) > 0:
            first_stage = event_stages[0]
            first_stage_name = first_stage.get("name") or first_stage.get("type")

        # Create/update participant
        participant_doc = {
            "event_id": str(event_id),
            "user_id": str(user_id),
            "institution_id": institution_id or event.get("createdBy") or event.get("institution_id"),
            "name": name,
            "email": email,
            "current_stage": first_stage_name,
            "registration_data": merged_data,
            "registration_fields_filled": registration_data,
            "prefilled_fields_used": merge_result["prefilled_count"],
            "status": "registered",
            "registered_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        
        result = await participants_col.update_one(
            {"event_id": str(event_id), "user_id": str(user_id)},
            {"$set": participant_doc},
            upsert=True
        )
        
        # Store registration submission in submission_data for tracking
        actual_stage_name = first_stage_name or event.get("title", "registration")
        await submission_data_col.update_one(
            {
                "event_id": str(event_id),
                "user_id": str(user_id),
                "stage_id": "registration",
            },
            {
                "$set": {
                    "event_id": str(event_id),
                    "user_id": str(user_id),
                    "stage_id": "registration",
                    "stage_name": actual_stage_name,
                    "data": merged_data,
                    "submitted_at": datetime.now(timezone.utc),
                    "status": "submitted",
                }
            },
            upsert=True
        )
        
        return {
            "status": "success",
            "message": "Registration completed successfully with auto-filled profile data",
            "participant_id": str(result.upserted_id) if result.upserted_id else "updated",
            "name": name,
            "email": email,
            "prefilled_fields": merge_result["prefilled_count"],
            "custom_fields": merge_result["custom_count"],
        }
    
    except Exception as e:
        print(f"[ERROR] complete_registration: {e}")
        return {"error": str(e), "status": "error"}

async def get_registration_fields_with_prefill(
    event_id: str,
    user_id: str
) -> Dict[str, Any]:
    """
    Get registration fields for an event with prefill information.
    Frontend uses this to know which fields are prefilled and which need user input.
    """
    try:
        event = await events_col.find_one({"_id": ObjectId(event_id)})
        if not event:
            return {"error": "Event not found"}
        
        user_profile = await get_user_profile_data(user_id)
        registration_fields = event.get("registrationFields", [])
        
        field_classification = await classify_registration_fields(
            registration_fields,
            user_profile
        )
        
        return {
            "status": "success",
            "event_id": event_id,
            "event_title": event.get("title", ""),
            "prefilled_fields": field_classification["prefilled"],
            "custom_fields": field_classification["custom"],
            "user_profile": user_profile,
            "prefilled_count": len(field_classification["prefilled"]),
            "custom_count": len(field_classification["custom"]),
        }
    
    except Exception as e:
        print(f"[ERROR] get_registration_fields_with_prefill: {e}")
        return {"error": str(e)}

async def check_registration_status(
    event_id: str,
    user_id: str
) -> Dict[str, Any]:
    """Check if user is already registered for an event."""
    try:
        participant = await participants_col.find_one({
            "event_id": str(event_id),
            "user_id": str(user_id)
        })
        
        if participant:
            return {
                "status": "registered",
                "registered_at": participant.get("registered_at"),
                "name": participant.get("name"),
                "email": participant.get("email"),
            }
        
        return {"status": "not_registered"}
    
    except Exception as e:
        print(f"[ERROR] check_registration_status: {e}")
        return {"error": str(e)}
