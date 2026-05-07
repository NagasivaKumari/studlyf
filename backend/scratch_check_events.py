import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['studlyf_db']
    events = await db['events'].find({}).to_list(100)
    for e in events:
        print(f"Event ID: {e.get('_id')}, Name: {e.get('name')}, Type: {e.get('event_type')}")

asyncio.run(check())
