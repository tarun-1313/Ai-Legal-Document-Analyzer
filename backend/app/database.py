"""
MongoDB Database Connection
Uses Motor (async MongoDB driver) for non-blocking database operations.
"""

from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from app.config import settings

# Global database client and reference
client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    """
    Establishes connection to MongoDB.
    Called during FastAPI startup event.
    """
    global client, db
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    try:
        # Using certifi.where() to provide the CA bundle for SSL verification on Windows
        # Adding tlsAllowInvalidCertificates for environments with strict proxies/firewalls
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            retryWrites=True
        )
        db = client[settings.MONGODB_DB_NAME]

        # Test the connection
        await client.admin.command('ping')

        # Create indexes for performance
        await db.users.create_index("email", unique=True)
        await db.documents.create_index("user_id")
        await db.documents.create_index("created_at")
        await db.chat_history.create_index([("document_id", 1), ("user_id", 1)])

        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise e


async def close_mongo_connection():
    """
    Closes the MongoDB connection gracefully.
    Called during FastAPI shutdown event.
    """
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_database():
    """Returns the database instance for dependency injection."""
    return db
