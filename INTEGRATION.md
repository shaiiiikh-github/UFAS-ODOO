# Frontend ↔ Backend Integration

This repo contains two apps that are now wired together end-to-end:

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL, in `app/` (repo root)
- **Frontend**: React + Vite, in `urban-furniture-frontend/`

## What was connected

1. **API base URL** — the frontend never hardcodes a host. Every request goes
   through `urban-furniture-frontend/src/api/axios.js`, which reads
   `VITE_API_BASE_URL` from `urban-furniture-frontend/.env`. It's set to
   `http://127.0.0.1:8000`, matching the backend's default `uvicorn` port.
   Uploaded images (e.g. contact profile pictures) are served from the
   backend's `/static` mount and are prefixed with the same base URL in the
   UI (see `pages/Contacts.jsx`).

2. **Auth** — login returns a JWT (`/api/auth/login`). The frontend stores it
   and attaches `Authorization: Bearer <token>` to every request
   (`api/axios.js`). No cookies are used, so there's no cross-site cookie
   configuration to worry about.

3. **CORS** — `app/main.py` now reads allowed origins from
   `CORS_ORIGINS` in the backend `.env` (previously hardcoded to `*`, which
   is unsafe when `allow_credentials=True`). Defaults to the Vite dev server:
   `http://localhost:5173,http://127.0.0.1:5173`. Add your production
   frontend origin here (comma-separated) when you deploy.

4. **Environment files**:
   - `/.env` (backend) — DB connection, JWT secret, CORS origins. Created
     for you with working local-dev defaults; `.env.example` is the
     committed template.
   - `/urban-furniture-frontend/.env` — `VITE_API_BASE_URL`, already set.

5. **Database migrations** — `alembic/env.py` already reads the DB URL from
   `app/core/config.py`, so it automatically follows whatever is in `.env`.

## Run it — Option A: Docker (recommended, one command)

This spins up Postgres, the backend (with migrations + seed data run
automatically), and the frontend dev server, all networked together:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

Demo logins (created by the seed script):

| Role       | Email                          | Password        |
|------------|---------------------------------|------------------|
| Admin      | admin@urbanfurniture.test      | Admin@12345      |
| Accountant | accountant@urbanfurniture.test | Accountant@12345 |
| Contact    | nimesh@example.com             | Nimesh@12345     |

## Run it — Option B: Manual (no Docker)

**1. Postgres** — have a Postgres server running locally, matching the
values in `.env` (default: `localhost:5433`, db `urban_accounting`).

**2. Backend**

```bash
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

Runs on `http://127.0.0.1:8000`.

**3. Frontend** (separate terminal)

```bash
cd urban-furniture-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and talks to the backend via
`VITE_API_BASE_URL`.

> Note: the `node_modules/` bundled in the original upload had a platform
> mismatch (native bindings built for a different OS/arch) and was removed
> from this package. Run `npm install` fresh — `package.json` and
> `package-lock.json` are untouched, so it will resolve the same versions.

## Changing ports / hosts later

- Backend port/host → change the `uvicorn` command (or `docker-compose.yml`
  for the `backend` service).
- Frontend dev port → `urban-furniture-frontend/vite.config.js`.
- Whatever you change, update `VITE_API_BASE_URL` (frontend `.env`) and
  `CORS_ORIGINS` (backend `.env`) to match, on both sides.
