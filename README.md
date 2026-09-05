# Urban Furniture Accounting System

This project implements the accounting automation required for the Urban Furniture hackathon specification.

## Payment-to-Ledger Automation

The critical workflow is now atomic and end-to-end:

```text
Invoice / Vendor Bill
        ↓
Register Payment
        ↓
Validate outstanding amount + Bank/Cash journal
        ↓
Create Payment record
        ↓
Create balanced Journal Entry
        ↓
Update amount paid + status
        ↓
Commit transaction
        ↓
Dashboard reloads live COA balances
        ↓
P&L / Balance Sheet / Budget Report recalculate from journal data
```

A payment never marks a document paid by changing a flag alone. It creates a real payment record and balanced debit/credit journal entry.

## Accounting behavior

Customer payment:

```text
Bank/Cash       Dr
    Debtors         Cr
```

Vendor payment:

```text
Creditors       Dr
    Bank/Cash        Cr
```

Invoice posting:

```text
Debtors         Dr
    Sales Income     Cr
    Tax Payable      Cr   (when tax exists)
```

Vendor bill posting:

```text
Purchase Expense Dr
Input Tax         Dr   (when tax exists)
    Creditors         Cr
```

All generated entries are checked so total debit equals total credit.

## Dynamic reporting

- P&L is calculated from Income and Expense journal items.
- Balance Sheet is calculated from Asset, Liability and Equity journal items plus current-period net profit.
- Live COA account balances are available from `/api/accounts/`.
- Budget actuals are calculated from analytic journal items for the budget's analytic account and period.
- Budget variance and utilization are calculated dynamically.
- Reports accept date filters where applicable.

## Important API endpoints

- `POST /api/payments/` — register a partial/full payment and automatically post the accounting entry.
- `GET /api/payments/` — payment history.
- `GET /api/documents/{document_id}/payments` — payment history for one bill/invoice.
- `GET /api/journals/` — available journals, including Bank/Cash journals.
- `GET /api/accounts/` — live COA account balances.
- `GET /api/journal-entries/` — accounting audit trail.
- `GET /api/reports/pnl` — dynamic P&L.
- `GET /api/reports/balance-sheet` — dynamic Balance Sheet.
- `GET /api/reports/budget` — dynamic Budget Report.

## Database migration

After pulling the changes into an existing database:

```bash
alembic upgrade head
python seed.py
```

The new migration creates the `payments` table.

## Run

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

Open the application at:

```text
http://127.0.0.1:8000/
```

API documentation is available at `/docs`.

## Notes

The supplied repository is a FastAPI + SQLAlchemy application that models the hackathon accounting workflow; it is not using native Odoo ORM models. The implementation therefore preserves the repository's existing architecture rather than replacing it with an Odoo addon structure.
