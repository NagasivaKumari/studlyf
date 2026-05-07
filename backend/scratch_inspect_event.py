import asyncio
import json
from bson import json_util, ObjectId
from db import events_col, opportunities_col

async def check():
    event_id = "69fb6bda6070fc83c566c5af"
    event = await events_col.find_one({"_id": ObjectId(event_id)})
    if event:
        print("Event Found:")
        print(json_util.dumps(event, indent=2))
    else:
        print(f"Event {event_id} not found")

    opp = await opportunities_col.find_one({"event_link_id": {"$in": [event_id, ObjectId(event_id)]}})
    if opp:
        print("\nLinked Opportunity Found:")
        print(json_util.dumps(opp, indent=2))
    else:
        print(f"\nNo opportunity linked to {event_id}")

if __name__ == "__main__":
    asyncio.run(check())
