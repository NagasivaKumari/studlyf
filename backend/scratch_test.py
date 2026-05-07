import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def test():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['studlyf_db']
    opp_col = db['opportunities']
    
    # We want to find the opportunity that corresponds to the event_id or hackathonId
    # "69fb6bda6070fc83c566c5b1" is the hackathonId
    
    # Is it an opportunity ID?
    opp1 = await opp_col.find_one({"_id": ObjectId("69fb6bda6070fc83c566c5b1")})
    print(f"Opp by ID: {bool(opp1)}")
    
    # Is it an event ID?
    ev_col = db['events']
    ev1 = await ev_col.find_one({"_id": ObjectId("69fb6bda6070fc83c566c5b1")})
    print(f"Event by ID: {bool(ev1)}")

    if opp1:
        print(f"Opp event_link_id: {opp1.get('event_link_id')}")

asyncio.run(test())
