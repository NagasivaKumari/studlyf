"""Check which logo/banner URLs in DB are not base64."""
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
    
    for col_name in ['events', 'opportunities', 'institutions']:
        col = db[col_name]
        count = 0
        async for doc in col.find({}):
            for f in ['logo_url', 'banner_url']:
                val = doc.get(f, '')
                if val and not val.startswith('data:'):
                    print(f'[{col_name}] {doc["_id"]}: {f} = {val[:120]}')
                    count += 1
        print(f'Total non-base64 in {col_name}: {count}')
    
    client.close()

asyncio.run(check())
