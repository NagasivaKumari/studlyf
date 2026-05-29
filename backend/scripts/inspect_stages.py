import asyncio
from bson import ObjectId
from db import db, events_col
from datetime import datetime, timezone

EID = '6a1923bdbcdebc6f5fff4fbb'

async def main():
    await db.connect()
    ev = await events_col.find_one({'_id': ObjectId(EID)})
    print('Event title:', ev.get('title'))
    stages = ev.get('stages', [])
    for i,s in enumerate(stages, start=1):
        print(i, 'id=', s.get('id'), 'name=', s.get('name'), 'type=', s.get('type'), 'end_date=', s.get('end_date'))
        try:
            ed = s.get('end_date')
            if isinstance(ed,str):
                ed_dt = datetime.fromisoformat(ed.replace('Z','+00:00'))
            else:
                ed_dt = None
            print('  end_date parsed:', ed_dt, 'now:', datetime.now(timezone.utc), 'passed=', ed_dt and datetime.now(timezone.utc) > ed_dt)
        except Exception as e:
            print('  parse error', e)

if __name__ == '__main__':
    asyncio.run(main())
