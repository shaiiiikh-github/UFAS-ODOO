# UFAS frontend integration - status

The frontend runs entirely on the FastAPI backend. Every `src/services/*` module
calls the real API (`src/lib/api.ts`); nothing uses mock data.

## Everything below is wired end-to-end and verified against a live database

Master data
- Contacts, Products, Chart of Accounts, Journals, Analytic Accounts, Budgets:
  create, edit, archive (soft delete). Account codes are synthesized client-side
  where the form omits them; budget period strings map to period_start/period_end.

Transactions
- Purchase Orders / Sales Orders: create, edit (draft), confirm (converts to
  Bill/Invoice), cancel, delete (draft).
- Vendor Bills / Customer Invoices: create, edit (draft), post (confirm -> journal
  entry), cancel, and register payments. Due dates persist. A converted document
  links back to its source order (PO/SO number shown).
- Payments (customer + vendor): full lifecycle - create draft, edit, post
  (creates the balanced journal entry and updates the document), cancel (voids the
  entry and restores the document balance). Payment method (Cash/Bank/UPI/Cheque/
  Other) is stored and shown.

Accounting
- Journal Entries: browse plus full manual lifecycle - create draft, edit, post
  (rejected unless balanced), cancel. System-generated entries (from posting a
  document or a payment) are protected: they cannot be manually edited or cancelled;
  cancel the source document/payment instead.
- Reports (P&L, Balance Sheet, Ledger, Budget): computed from journal items and now
  count only Posted entries, so cancelled documents/payments and draft entries drop
  out of the books automatically and the balance sheet stays balanced.

## Behaviour to know before a demo
1. Stock gating: posting a Customer Invoice for a Goods product consumes stock and
   is rejected if there is not enough. Posting a Vendor Bill adds stock. New goods
   start at 0, so stock them via a posted vendor bill first (or use Service products).
2. Cancelling a document that already has payments is refused with a clear message -
   cancel the payments first, then the document. This keeps the ledger consistent.
3. Razorpay online checkout (portal "pay online") needs RAZORPAY_KEY_ID /
   RAZORPAY_KEY_SECRET set on the backend. Without keys that one button returns a
   configuration error. Manual payments do not need it.

## Verification method
Every endpoint behind every button was exercised over HTTP against a live
PostgreSQL + backend, using the exact request shapes these services send, and
asserting the ledger stays balanced through confirm / pay / cancel. The frontend
type-checks (`tsc -b`) and production-builds (`vite build`) with zero errors.
The browser DOM clicks themselves were not automated (no headless browser in the
build environment); the API calls they trigger are what is verified.
