import asyncio
import json
from bson import json_util
from db import hackathon_submissions_col

async def check():
    doc = await hackathon_submissions_col.find_one()
    if doc:
        print(json_util.dumps(doc, indent=2))
    else:
        print("No documents found in hackathon_submissions_col")

if __name__ == "__main__":
    asyncio.run(check())
