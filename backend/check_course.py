import asyncio, os, certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
client = AsyncIOMotorClient(os.getenv("MONGO_URL"), tlsCAFile=certifi.where())
db = client["studlyf_db"]

async def check():
    c = await db.courses.find_one({"_id": "ai-01"}, {"title": 1, "school": 1, "modules_count": 1, "status": 1, "image": 1})
    print("Course:", c)
    m_count = await db.modules.count_documents({"course_id": "ai-01"})
    print("Modules in modules_col:", m_count)

asyncio.run(check())
