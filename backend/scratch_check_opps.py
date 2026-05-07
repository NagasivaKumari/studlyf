import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['studlyf_db']
    opps = await db['opportunities'].find({}).to_list(100)
    for o in opps:
        print(f"Opp ID: {o.get('_id')}, event_link_id: {o.get('event_link_id')}")

asyncio.run(check())
