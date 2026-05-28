import asyncio
from db import participants_col

async def main():
    from services.dynamic_submission_service import submit_stage_data
    # Prepare test user and participant
    user_id = 'auto-test-user-1'
    event_id = '6a103270211d257a21311d65'
    stage_id = '913127c5-6896-4caf-ada8-12258ce8ee50'  # Submission stage

    # Ensure participant exists
    await participants_col.update_one(
        {"user_id": user_id, "event_id": event_id},
        {"$set": {"user_id": user_id, "event_id": event_id, "name": "Auto Test", "email": "auto@test.local", "status": "shortlisted"}},
        upsert=True
    )

    form_data = {
        "eexxhqlbx": "Auto Project",
        "3gspz1yeq": "Auto description",
        "qc4kjajk": "",  # file field can be empty for test
        "f3vp1p2dz": "https://github.com/example/repo"
    }

    res = await submit_stage_data(event_id=event_id, stage_id=stage_id, user_id=user_id, form_data=form_data)
    print('submit result:', res)

if __name__ == '__main__':
    asyncio.run(main())
