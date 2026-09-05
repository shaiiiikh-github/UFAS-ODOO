import asyncio
import asyncpg
from app.core.config import settings

async def test_connection():
    print(f"Trying to connect using URL: {settings.async_database_url}")
    try:
        # Convert SQLAlchemy async URL format to plain asyncpg format for testing
        dsn = settings.async_database_url.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(dsn)
        version = await conn.fetchval("SELECT version();")
        print("\nSUCCESS! Connected to PostgreSQL successfully:")
        print(version)
        await conn.close()
    except Exception as e:
        print("\nCONNECTION FAILED:")
        print(type(e).__name__, e)

if __name__ == "__main__":
    asyncio.run(test_connection())