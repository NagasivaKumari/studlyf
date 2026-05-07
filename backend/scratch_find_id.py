import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def search_id():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['studlyf_db']
    collections = await db.list_collection_names()
    target = ObjectId("69fb6bda6070fc83c566c5b1")
    
    for coll_name in collections:
        try:
            col = db[coll_name]
            doc = await col.find_one({"_id": target})
            if doc:
                print(f"FOUND in {coll_name}!")
                print(doc)
        except Exception as e:
            pass

asyncio.run(search_id())
