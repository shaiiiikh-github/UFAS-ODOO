#!/bin/sh
set -e

echo "Waiting for Postgres at ${POSTGRES_SERVER}:${POSTGRES_PORT}..."
python - <<'PYCODE'
import asyncio
import os
import sys

import asyncpg

async def wait():
    for _ in range(60):
        try:
            conn = await asyncpg.connect(
                user=os.environ["POSTGRES_USER"],
                password=os.environ["POSTGRES_PASSWORD"],
                host=os.environ["POSTGRES_SERVER"],
                port=int(os.environ["POSTGRES_PORT"]),
                database=os.environ["POSTGRES_DB"],
            )
            await conn.close()
            return
        except Exception:
            await asyncio.sleep(1)
    print("Postgres never became available.", file=sys.stderr)
    sys.exit(1)

asyncio.run(wait())
PYCODE

echo "Running migrations..."
alembic upgrade head

echo "Seeding database (idempotent)..."
python seed.py

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
