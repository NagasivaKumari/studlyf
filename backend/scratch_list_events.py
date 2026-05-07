import asyncio
from db import events_col

async def check():
    cursor = events_col.find()
    async for doc in cursor:
        print(f"{doc.get('title')}: {doc.get('_id')}")

if __name__ == "__main__":
    asyncio.run(check())
