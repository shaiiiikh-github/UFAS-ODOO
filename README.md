# Urban Furniture Accounting System (UFAS) - integrated build

Backend (`BackEnd/`, FastAPI + PostgreSQL) and frontend (`FrontBack/`, React + Vite),
wired together and working end-to-end. The frontend previously ran on in-memory mock
data; every service under `FrontBack/src/services/` now calls the real backend, and
every action in the UI has a real backend endpoint behind it.

## What works
The full accounting workflow plus every document/payment/journal action:
master data CRUD and archiving; purchase and sales orders (create/edit/confirm/
cancel/delete); vendor bills and customer invoices (create/edit/post/cancel/pay,
with due dates and source-order links); the payment lifecycle (draft -> post ->
cancel, with method); manual journal entries (create/edit/post/cancel with balance
enforcement and protection of system entries); and the reports (P&L, balance sheet,
ledger, budget), which count only posted entries so cancellations keep the books
balanced. See `FrontBack/STATUS.md` for the detailed per-feature status and the
verification method.

## The backend in this package
The backend has been extended beyond the original to support the full UI:
- New columns (migration `e6a1b2c3d4e5`): journal-entry status, payment status +
  method, document due_date + source link, and a `Cancelled` document status.
- New endpoints: document edit/delete/cancel; manual journal entry create/edit/
  post/cancel; and payment edit/post/cancel (POST `/api/payments/` now creates a
  draft, which you then post).
- One original bug fixed: `/api/journal-entries/` referenced `JournalItemResponse`
  without importing it (a `NameError` that broke journal entries, ledger, balance
  sheet, and P&L).
Report queries now filter to posted journal entries only.

## Run

### 1. Backend
```
cd BackEnd
python -m venv .venv && source .venv/bin/activate    # optional
pip install -r requirements.txt
cp .env.example .env                                 # set POSTGRES_* to your DB
# create the database, then:
alembic upgrade head                                 # includes migration e6a1b2c3d4e5
python seed.py
uvicorn app.main:app --reload                        # http://127.0.0.1:8000
```

### 2. Frontend
```
cd FrontBack
cp .env.example .env                                 # VITE_API_BASE_URL=http://127.0.0.1:8000
npm install
npm run dev                                           # http://localhost:5173
```
Restart `npm run dev` after creating `.env` (Vite reads env only at startup).

### Seed logins
- Admin:      `admin@urbanfurniture.test` / `Admin@12345`
- Accountant: `accountant@urbanfurniture.test` / `Accountant@12345`
- Contact:    `nimesh@example.com` / `Nimesh@12345`  (portal view)

## Two things to know before a demo
1. Stock gating: posting a Customer Invoice for a `Goods` product consumes stock and
   is rejected if there isn't enough; posting a Vendor Bill adds stock. New goods
   start at 0 stock, so stock them via a posted vendor bill first, or use `Service`
   products.
2. Cancelling a document that already has payments is refused (cancel the payments
   first). Razorpay online checkout needs API keys set on the backend; manual
   payments do not.
