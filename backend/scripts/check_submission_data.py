"""Check submission_data and events in DB."""
import os, sys, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

async def check():
    url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME', 'studlyf_db')
    client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=20000, tlsCAFile=certifi.where() if url.lower().startswith('mongodb+srv://') else None)
    db = client[db_name]
    
    print('=== submission_data ===')
    count = 0
    async for doc in db['submission_data'].find({}):
        count += 1
        eid = doc.get('event_id', '')
        sid = doc.get('stage_id', '')
        uid = doc.get('user_id', '')
        dkeys = list(doc.get('data', {}).keys())
        status = doc.get('status', '')
        print(f'  event_id={eid} stage_id={sid} user_id={uid} keys={dkeys} status={status}')
    print(f'Total: {count}')
    
    print('\n=== events (first 5) ===')
    async for ev in db['events'].find({}).limit(5):
        print(f'  _id={ev["_id"]} title={ev.get("title")} institution_id={ev.get("institution_id")}')
    
    client.close()

asyncio.run(check())
