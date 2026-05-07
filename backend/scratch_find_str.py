import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def search_string():
    db = AsyncIOMotorClient('mongodb://localhost:27017')['studlyf_db']
    collections = await db.list_collection_names()
    target = "69fb6bda6070fc83c566c5b1"
    
    for coll_name in collections:
        col = db[coll_name]
        # Search by _id as string
        doc = await col.find_one({"_id": target})
        if doc:
            print(f"FOUND string _id in {coll_name}!")
            
        # Search by id as string
        doc2 = await col.find_one({"id": target})
        if doc2:
            print(f"FOUND string id in {coll_name}!")

asyncio.run(search_string())
