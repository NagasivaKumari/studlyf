"""
Stage Access Control - Validate participant eligibility for stage submissions
Admin controls who can progress through stages via shortlist/reject status
Also enforces time-based stage deadlines (e.g., registration 18:00-19:00)
"""

from fastapi import HTTPException
from db import participants_col, opportunities_col, events_col
from datetime import datetime, timezone
from bson import ObjectId
from services.stage_service import get_event_stages
from typing import Optional

async def check_stage_unlock_rules(
    event_id: str,
    user_id: str,
    stage: dict
) -> None:
    """
    Check if all dependency stages (depends_on) have been completed by the participant.
    
    Each stage's `depends_on` lists stage IDs (or type names) that must be completed
    before this stage unlocks. Completion is determined by:
    1. Participant's `current_stage` being past the dependency stage index
    2. Or participant's `status` indicating advancement past the dependency
    
    Raises HTTPException 403 if any dependency is not met.
    """
    depends_on = stage.get("depends_on", [])
    if not depends_on:
        return

    participant = await participants_col.find_one({
        "event_id": str(event_id),
        "user_id": str(user_id)
    })
    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You must register before accessing this stage."
        )

    stages = await get_event_stages(event_id)
    if not stages:
        raise HTTPException(status_code=404, detail="No stages configured for this event")

    participant_status = (participant.get("status") or "pending").lower()
    participant_current_stage = participant.get("current_stage")

    # Build a map of stage_id -> stage for quick lookup
    stage_map = {s["id"]: s for s in stages}

    for dep_ref in depends_on:
        # Find the dependency stage by id or by type name
        dep_stage = stage_map.get(dep_ref)
        if not dep_stage:
            for s in stages:
                if s.get("type", "").upper() == dep_ref.upper() or s.get("name", "").lower() == dep_ref.lower():
                    dep_stage = s
                    break

        if not dep_stage:
            continue  # unknown dependency — skip

        dep_name = dep_stage.get("name", dep_ref)
        dep_order = dep_stage.get("order")

        # Check if participant's current_stage is past the dependency
        if participant_current_stage:
            current_past_dep = False
            for s in stages:
                if s.get("name") == participant_current_stage or s.get("type") == participant_current_stage:
                    if s.get("order", 0) > dep_order:
                        current_past_dep = True
                    break
            if current_past_dep:
                continue

        # Check participant status as fallback
        if participant_status in ("shortlisted", "accepted", "selected"):
            # Only allow if dependency is before current stage
            continue

        raise HTTPException(
            status_code=403,
            detail=f"Stage '{stage.get('name', 'this stage')}' is locked. You must complete '{dep_name}' first."
        )


async def check_stage_submission_access(
    event_id: str, 
    user_id: str, 
    team_id: str = None,
    stage_type: str = None,  # "team_formation", "submission", "final"
    stage: Optional[dict] = None  # Full stage object for unlock rules
):
    """
    Validate if participant can submit at this stage.
    
    Rules:
    - team_formation stage: participant must exist (registered)
    - submission stage: participant status must be "shortlisted" or "accepted"
    - final stage: participant status must be "shortlisted" or "accepted"
    
    Args:
        event_id: The event/opportunity ID
        user_id: The user attempting to submit
        team_id: Optional team ID (for team submissions)
        stage_type: The current stage type
    
    Returns:
        dict with participant data if allowed
    
    Raises:
        HTTPException 403 if not eligible
        HTTPException 404 if participant not found
    """
    
    # Find participant record
    query = {
        "event_id": str(event_id),
        "user_id": str(user_id)
    }
    
    participant = await participants_col.find_one(query)
    
    if not participant:
        raise HTTPException(
            status_code=404, 
            detail="Participant not found. Please register for this event first."
        )
    
    current_status = (participant.get("status") or "pending").lower()

    # Enforce unlock rules if stage object is provided
    if stage:
        await check_stage_unlock_rules(event_id, user_id, stage)

    # Stage-specific validation
    if stage_type in ["submission", "final"]:
        # Only shortlisted/accepted participants can submit in these stages
        allowed_statuses = ["shortlisted", "accepted"]
        
        if current_status not in allowed_statuses:
            raise HTTPException(
                status_code=403,
                detail=f"You cannot submit at this stage. Your application status is '{current_status}'. "
                       f"Only shortlisted participants can submit. Please wait for admin review."
            )

        # Additional rule: if the stage requires a team, ensure participant belongs to a team
        # unless the event explicitly allows individual progression without a team.
        try:
            event = await events_col.find_one({"_id": ObjectId(event_id)})
        except Exception:
            event = await events_col.find_one({"event_link_id": str(event_id)})

        allow_individual = False
        try:
            if event and event.get("allow_individual_progress_with_no_team"):
                allow_individual = True
        except:
            allow_individual = False

        # If participant has no team, check stage config for team requirement
        if not participant.get("team_id") and not allow_individual:
            # Look up event stages and find a SUBMISSION stage config
            try:
                stages = await get_event_stages(str(event.get("_id"))) if event else []
                submission_stage = None
                for s in stages:
                    if (s.get("type") or "").upper() == "SUBMISSION":
                        submission_stage = s
                        break
                team_required = False
                if submission_stage:
                    # stage-level config overrides
                    cfg = submission_stage.get("config") or {}
                    if isinstance(cfg, dict) and cfg.get("team_required") is not None:
                        team_required = bool(cfg.get("team_required"))
                    else:
                        team_required = bool(submission_stage.get("team_required", False))

                if team_required:
                    raise HTTPException(
                        status_code=403,
                        detail="This stage requires a team. Please form or join a team before submitting."
                    )
            except HTTPException:
                raise
            except Exception:
                # If we can't determine stage config, be conservative and allow (don't block unexpectedly)
                pass
    
    elif stage_type == "team_formation":
        # Registered participants can form teams
        # But rejected participants cannot
        if current_status == "rejected":
            raise HTTPException(
                status_code=403,
                detail="Your application has been rejected. You cannot proceed to team formation."
            )
    
    return participant


async def check_team_submission_access(
    event_id: str,
    team_id: str,
    stage_type: str = None
):
    """
    Validate if team can submit at this stage.
    All team members must be shortlisted for submission/final stages.
    """
    from db import teams_col
    
    team = await teams_col.find_one({"_id": team_id, "event_id": str(event_id)})
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    
    if stage_type in ["submission", "final"]:
        # Check all team members' status
        member_ids = team.get("members", [])
        
        for member in member_ids:
            member_user_id = member.get("user_id")
            member_status = await participants_col.find_one({
                "event_id": str(event_id),
                "user_id": str(member_user_id)
            })
            
            if not member_status or (member_status.get("status") or "").lower() not in ["shortlisted", "accepted"]:
                raise HTTPException(
                    status_code=403,
                    detail=f"Not all team members are shortlisted. All members must be approved before submission."
                )
    
    return team


async def check_stage_deadline(event_id: str, stage_index: int = None, stage_name: str = None):
    """
    Validate if current time is within stage deadline window.
    
    Stages have start_date and end_date. Users can only act during this window.
    Example: Registration open 18:00-19:00 only
    
    Args:
        event_id: The event/opportunity ID
        stage_index: Index of stage (0, 1, 2, etc.)
        stage_name: Name of stage (e.g., "Registration", "Team Formation")
    
    Returns:
        dict with stage data if allowed
    
    Raises:
        HTTPException 403 if outside stage window
        HTTPException 404 if stage not found
    """
    try:
        opp_id = ObjectId(event_id) if len(str(event_id)) == 24 else event_id
    except:
        opp_id = event_id
    
    # Prefer the canonical `events` collection where stages are persisted by admins.
    opportunity = None
    try:
        # Try by ObjectId first if possible
        try:
            obj_id = ObjectId(event_id) if len(str(event_id)) == 24 else None
        except:
            obj_id = None

        if obj_id:
            opportunity = await events_col.find_one({"_id": obj_id})
        if not opportunity:
            opportunity = await events_col.find_one({"event_link_id": str(event_id)})
    except Exception:
        opportunity = None

    # Fallback to legacy `opportunities` collection for backward compatibility
    if not opportunity:
        opportunity = await opportunities_col.find_one({"_id": opp_id})
    if not opportunity:
        opportunity = await opportunities_col.find_one({"event_link_id": str(event_id)})
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Event/Opportunity not found")
    
    stages = opportunity.get("stages", [])
    
    if not stages:
        raise HTTPException(status_code=404, detail="No stages configured for this event")
    
    # Find the target stage
    target_stage = None
    stage_pos = None
    
    if stage_index is not None and 0 <= stage_index < len(stages):
        target_stage = stages[stage_index]
        stage_pos = stage_index
    elif stage_name:
        for idx, s in enumerate(stages):
            if (s.get("name") or "").lower() == stage_name.lower():
                target_stage = s
                stage_pos = idx
                break
    
    if not target_stage:
        raise HTTPException(status_code=404, detail=f"Stage not found (index: {stage_index}, name: {stage_name})")
    
    # Check if current time is within stage window
    now = datetime.now(timezone.utc)
    start_date = target_stage.get("start_date")
    end_date = target_stage.get("end_date")
    
    # Convert to datetime if they're strings
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    if isinstance(start_date, datetime) and start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if isinstance(end_date, datetime) and end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    
    if not start_date or not end_date:
        # If no dates set, allow it
        return target_stage
    
    # Check if now is within [start_date, end_date]
    if now < start_date:
        raise HTTPException(
            status_code=403,
            detail=f"This stage has not started yet. It opens at {start_date.strftime('%Y-%m-%d %H:%M UTC')}"
        )
    
    if now > end_date:
        raise HTTPException(
            status_code=403,
            detail=f"This stage has ended. It closed at {end_date.strftime('%Y-%m-%d %H:%M UTC')}"
        )
    
    return target_stage


async def check_stage_access(event_id: str, user_id: str, stage_index: int = None, stage_name: str = None):
    """
    Combined check: verify user can access stage (deadline + eligibility + unlock rules).
    
    Runs deadline, eligibility, and unlock rule checks.
    
    Args:
        event_id: The event/opportunity ID
        user_id: The user attempting to access
        stage_index: Index of stage
        stage_name: Name of stage
    
    Returns:
        dict with stage and participant data
    
    Raises:
        HTTPException if not allowed
    """
    # Check deadline first
    stage = await check_stage_deadline(event_id, stage_index, stage_name)

    # Enforce unlock rules
    await check_stage_unlock_rules(event_id, user_id, stage)
    
    # Check participant status
    participant = await participants_col.find_one({
        "event_id": str(event_id),
        "user_id": str(user_id)
    })
    
    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Participant not found. Please register for this event first."
        )
    
    current_status = (participant.get("status") or "pending").lower()
    stage_name_lower = (stage.get("name") or "").lower()
    
    # Submission/Final stages require shortlisted status
    if "submission" in stage_name_lower or "final" in stage_name_lower:
        if current_status not in ["shortlisted", "accepted"]:
            raise HTTPException(
                status_code=403,
                detail=f"You cannot access this stage. Your status is '{current_status}'. "
                       f"Only shortlisted participants can proceed."
            )
    
    # Rejected users blocked from team formation onwards
    elif "team" in stage_name_lower or "formation" in stage_name_lower:
        if current_status == "rejected":
            raise HTTPException(
                status_code=403,
                detail="Your application has been rejected. You cannot proceed."
            )
    
    return {"stage": stage, "participant": participant}
