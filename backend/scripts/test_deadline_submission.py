import asyncio
import sys
sys.path.insert(0,'backend')
from services.dynamic_submission_service import submit_stage_data
from db import db

EVENT_ID = '6a1923bdbcdebc6f5fff4fbb'
USER_ID = 'e2e_user_1'

# We'll pick the Final stage id by querying the event
from bson import ObjectId
from db import events_col

async def main():
    await db.connect()
    ev = await events_col.find_one({'_id': ObjectId(EVENT_ID)})
    stages = ev.get('stages', [])
    final = stages[-1]
    stage_id = final.get('id')
    print('Testing submission to stage:', final.get('name'), 'id=', stage_id, 'end_date=', final.get('end_date'))
    res = await submit_stage_data(EVENT_ID, stage_id, USER_ID, {'notes':'Late submission test'})
    print('Result:', res)

if __name__ == '__main__':
    asyncio.run(main())
