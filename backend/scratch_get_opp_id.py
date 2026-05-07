import asyncio
from bson import ObjectId
from db import opportunities_col

async def check():
    event_id = "69fb6bda6070fc83c566c5af"
    doc = await opportunities_col.find_one({'event_link_id': {'$in': [event_id, ObjectId(event_id)]}})
    if doc:
        print(f"Opportunity ID: {doc.get('_id')}")
    else:
        print("None")

if __name__ == "__main__":
    asyncio.run(check())
