from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import os
import certifi
import logging
from dotenv import load_dotenv

class MockCollection:
    """Mock collection that returns empty results when database is not available."""
    async def find_one(self, *args, **kwargs):
        return None
    
    async def find(self, *args, **kwargs):
        return MockCursor()
    
    async def insert_one(self, *args, **kwargs):
        return MockResult()
    
    async def update_one(self, *args, **kwargs):
        return MockResult()
    
    async def delete_one(self, *args, **kwargs):
        return MockResult()
    
    async def count_documents(self, *args, **kwargs):
        return 0
    
    def aggregate(self, *args, **kwargs):
        return MockCursor()
    
    async def create_index(self, *args, **kwargs):
        pass

class MockCursor:
    """Mock cursor that returns empty results."""
    async def to_list(self, length=None):
        return []
    
    def __aiter__(self):
        return self
    
    async def __anext__(self):
        raise StopAsyncIteration

class MockResult:
    """Mock result that returns default values."""
    def __init__(self):
        self.inserted_id = "mock_id"
        self.matched_count = 0
        self.modified_count = 0
        self.deleted_count = 0

# Setup production logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_service")

# Load from root directory .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class DatabaseManager:
    """
    Production-Grade Database Manager.
    Renamed instance to 'db' for compatibility.
    """
    def __init__(self):
        self.url = os.getenv("MONGO_URL")
        self.db_name = os.getenv("DB_NAME", "studlyf_db")
        
        if not self.url:
            logger.warning("MONGO_URL is not set in environment variables. Using placeholder.")
            self.url = "mongodb://localhost:27017"
            
        try:
            self.client = AsyncIOMotorClient(
                self.url,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where() if self.url.lower().startswith("mongodb+srv://") else None
            )
            self.db = self.client[self.db_name]
        except Exception as e:
            logger.error(f"Failed to initialize Motor Client: {e}")
            self.client = None
            self.db = None

    async def _ensure_connected(self):
        """Test connection on startup."""
        if self.client is not None:
            try:
                # Test connection
                await self.client.admin.command('ping')
                logger.info(f"Connected to MongoDB: {self.db_name}")
            except Exception as e:
                logger.error(f"Database Connection Failed: {e}")
                self.client = None
                self.db = None

    async def connect(self):
        """Verify connectivity and run health checks."""
        await self._ensure_connected()
        if self.db is not None:
            try:
                # Initialize core indexes
                await self.ensure_indexes()
            except Exception as e:
                logger.warning(f"Index creation warning: {e}")

    async def disconnect(self):
        """Graceful shutdown."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    async def ensure_indexes(self):
        """Enforces performance and data integrity."""
        if self.db is None:
            return
        try:
            await self.db.users.create_index("user_id", unique=True)
            await self.db.users.create_index("email", unique=True)
            await self.db.institutions.create_index("name", unique=True)
            await self.db.institutions.create_index("institution_id", unique=True)
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

    def __getitem__(self, collection_name: str):
        """Allows db['collection'] access with lazy connection."""
        if self.db is None:
            # Return a mock collection that doesn't crash
            return MockCollection()
        return self.db[collection_name]

    def __getattr__(self, name: str):
        """Allows db.collection access."""
        return self.__getitem__(name)

# --- Global Instance renamed to 'db' as requested ---
db = DatabaseManager()

# ─── COLLECTION REGISTRY ──────────────────────────────────────────────────────
# Academic Core
courses_col = db["courses"]
modules_col = db["modules"]
theories_col = db["theories"]
videos_col = db["videos"]
quizzes_col = db["quizzes"]
projects_col = db["projects"]
progress_col = db["progress"]

# Marketplace & Identity
cart_col = db["cart"]
enrollments_col = db["enrollments"]
users_col = db["users"]
resumes_col = db["resumes"]
certificates_col = db["certificates"]

# Career & Operations
interviews_col = db["interviews"]
mentors_col = db["mentors"]
companies_col = db["companies"]
skill_assessments_col = db["skill_assessments"]
ads_col = db["advertisements"]
payments_col = db["payments"]
audit_logs_col = db["audit_logs"]

# System Deconstruction Lab (SDL)
sdl_projects_col = db["sdl_projects"]
sdl_members_col = db["sdl_project_members"]
sdl_tasks_col = db["sdl_tasks"]
sdl_comments_col = db["sdl_comments"]
sdl_join_requests_col = db["sdl_join_requests"]

# Institution Dashboard Ecosystem (High-End Modular Architecture)
institutions_col = db["institutions"]
events_col = db["events"]
rounds_col = db["rounds"]                # Dynamic Phases (Assessment, Submission, etc.)
form_fields_col = db["form_fields"]      # Form Builder Layer
participants_col = db["participants"]
teams_col = db["teams"]
submissions_col = db["submissions"]
submission_data_col = db["submission_data"] # Flexibility Layer (Key-Value for PPT, GitHub)
judges_col = db["judges"]
scores_col = db["scores"]
evaluation_criteria_col = db["evaluation_criteria"] # Evaluation System
notifications_col = db["notifications"]
leaderboard_col = db["leaderboard"]
results_col = db["results"]
event_judges_col = db["event_judges"]
workflow_states_col = db["workflow_states"] # State Machine (Applied, Shortlisted, etc.)

# Career & Recruitment (High-Fidelity Tracking)
jobs_col = db["jobs"]
internships_col = db["internships"]
applications_col = db["applications"] # Tracks Selections, Rejections, and Status
opportunities_col = db["opportunities"]
opportunity_applications_col = db["opportunity_applications"]

# ─── GRIDFS BUCKET (persistent file storage, survives Render restarts) ────────
# Usage: await gridfs_bucket.upload_from_stream(filename, data) → ObjectId
#        await gridfs_bucket.open_download_stream(file_id) → stream
def _get_gridfs_bucket():
    """Lazy GridFS bucket — only created once db.db is available."""
    if db.db is not None:
        try:
            return AsyncIOMotorGridFSBucket(db.db, bucket_name="stage_files")
        except Exception as e:
            logger.error(f"Failed to create GridFS bucket: {e}")
            return None
    return None

# Remove global initialization - will be created lazily when needed
gridfs_bucket = None
