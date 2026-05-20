import pytest
import asyncio
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from db import db, events_col, users_col, participants_col, teams_col, submission_data_col
from services.registration_service import complete_registration
from services.team_service import create_team, leave_team
from services.dynamic_submission_service import submit_stage_data, get_submission_data


@pytest.mark.asyncio
async def test_e2e_event_registration_team_submission_cleanup():
    # Ensure DB connected
    await db.connect()

    ts = int(datetime.now(timezone.utc).timestamp())
    user_id = f"e2e_user_{ts}"
    event_obj_id = ObjectId()
    event_id = str(event_obj_id)

    # Create test user
    await users_col.update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, "full_name": "E2E Tester", "email": f"{user_id}@example.test"}},
        upsert=True
    )

    now = datetime.now(timezone.utc)
    # Create test event with registration and submission stages
    test_event = {
        "_id": event_obj_id,
        "event_id": event_id,
        "title": "E2E Test Event",
        "institution_id": "e2e_institution",
        "status": "active",
        "created_at": now,
        "stages": [
            {"id": "reg-stage", "name": "Registration", "type": "REGISTRATION", "start_date": (now - timedelta(days=1)).isoformat(), "end_date": (now + timedelta(days=1)).isoformat()},
            {"id": "submission-stage", "name": "Submission", "type": "SUBMISSION", "start_date": (now - timedelta(days=1)).isoformat(), "end_date": (now + timedelta(days=1)).isoformat(), "fields": [{"field_id": "project_url", "label": "Project URL", "field_type": "url", "required": True}]}
        ]
    }

    await events_col.insert_one(test_event)

    try:
        # Complete registration (should create participant and registration submission)
        reg_result = await complete_registration(event_id, user_id, registration_data={})
        assert reg_result.get("status") == "success"

        participant = await participants_col.find_one({"event_id": event_id, "user_id": user_id})
        assert participant is not None

        # Create a team (user is leader)
        team_res = await create_team(event_id=event_id, user_id=user_id, team_name="E2E Team")
        assert team_res.get("status") == "success"
        team = team_res.get("team")
        team_id = team.get("_id")

        # Submit for submission-stage as team
        form_data = {"project_url": "https://example.com/project"}
        submit_res = await submit_stage_data(event_id, "submission-stage", user_id, form_data, team_id=team_id)
        assert submit_res.get("status") == "success"

        # Verify submission exists
        sub = await submission_data_col.find_one({"event_id": event_id, "stage_id": "submission-stage", "team_id": team_id})
        assert sub is not None

        # Now delete the team by leader (leave_team will delete for leader)
        leave_res = await leave_team(event_id=event_id, user_id=user_id)
        assert leave_res.get("status") == "success"
        assert leave_res.get("team_deleted") is True

        # Participant should have team_id unset
        participant_after = await participants_col.find_one({"event_id": event_id, "user_id": user_id})
        assert participant_after is not None
        assert not participant_after.get("team_id")

        # Submission should still exist (audit record preserved)
        sub_after = await submission_data_col.find_one({"event_id": event_id, "stage_id": "submission-stage", "team_id": team_id})
        assert sub_after is not None

    finally:
        # Cleanup all created documents
        await events_col.delete_one({"_id": event_obj_id})
        await users_col.delete_one({"user_id": user_id})
        await participants_col.delete_many({"event_id": event_id})
        await teams_col.delete_many({"event_id": event_id})
        await submission_data_col.delete_many({"event_id": event_id})
