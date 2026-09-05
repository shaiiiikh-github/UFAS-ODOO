from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import uuid

import razorpay
from fastapi import HTTPException
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings

from app.models.accounting import (
    Account,
    AccountType,
    AnalyticAccount,
    AnalyticType,
    Budget,
    Journal,
    JournalEntry,
    JournalItem,
    Payment,
)
from app.models.domain import (
    DocumentLine,
    DocumentStatus,
    DocumentType,
    Product,
    ProductType,
    TransactionDocument,
)

MONEY = Decimal("0.01")
ZERO = Decimal("0.00")


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def require_positive_amount(amount: Decimal) -> Decimal:
    amount = money(amount)
    if amount <= ZERO:
        raise HTTPException(400, "Payment amount must be greater than zero.")
    return amount


async def get_account_map(db: AsyncSession) -> dict[str, Account]:
    result = await db.execute(select(Account))
    return {account.code: account for account in result.scalars().all()}


async def create_balanced_entry(
    db: AsyncSession,
    *,
    entry_date: date,
    reference: str,
    journal_id: uuid.UUID | None,
    lines: list[dict],
) -> JournalEntry:
    """Create a balanced journal entry and fail before commit if it is not balanced."""
    debit_total = sum((money(line.get("debit", ZERO)) for line in lines), ZERO)
    credit_total = sum((money(line.get("credit", ZERO)) for line in lines), ZERO)

    if debit_total != credit_total:
        raise HTTPException(
            500,
            f"Accounting error: journal entry is unbalanced. Debit={debit_total}, Credit={credit_total}.",
        )
    if debit_total <= ZERO:
        raise HTTPException(400, "Journal entry must contain a positive accounting amount.")

    entry = JournalEntry(
        date=entry_date,
        reference=reference,
        journal_id=journal_id,
    )
    db.add(entry)
    await db.flush()

    for line in lines:
        debit = money(line.get("debit", ZERO))
        credit = money(line.get("credit", ZERO))
        if debit < ZERO or credit < ZERO or (debit > ZERO and credit > ZERO):
            raise HTTPException(400, "Each journal line must contain either debit or credit, never both.")
        db.add(
            JournalItem(
                entry_id=entry.id,
                account_id=line["account_id"],
                analytic_account_id=line.get("analytic_account_id"),
                debit=debit,
                credit=credit,
            )
        )
    return entry


async def confirm_transaction_document(db: AsyncSession, document_id: uuid.UUID):
    """Post a vendor bill/customer invoice and update stock exactly once."""
    result = await db.execute(
        select(TransactionDocument)
        .options(
            selectinload(TransactionDocument.lines).selectinload(DocumentLine.product),
            selectinload(TransactionDocument.contact),
        )
        .where(TransactionDocument.id == document_id)
        .with_for_update()
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found.")
    if doc.status != DocumentStatus.DRAFT:
        raise HTTPException(400, "Only Draft documents can be confirmed.")
    if doc.type not in {DocumentType.VENDOR_BILL, DocumentType.CUSTOMER_INVOICE}:
        raise HTTPException(400, "Only Vendor Bills and Customer Invoices can be posted to the ledger.")
    if not doc.lines:
        raise HTTPException(400, "Cannot post a document without lines.")

    accounts = await get_account_map(db)
    try:
        debtor = accounts["1003"]
        creditor = accounts["2001"]
        sales = accounts["4001"]
        purchase = accounts["5001"]
    except KeyError as exc:
        raise HTTPException(500, "Essential ledger accounts are missing. Run seed.py.") from exc

    analytic_id = doc.lines[0].analytic_account_id
    output_tax_account = accounts.get("2101")
    input_tax_account = accounts.get("1004")

    # Revenue/expense uses the pre-tax subtotal. Tax is posted separately so P&L
    # does not incorrectly count tax collected/paid as income/expense.
    if doc.tax_amount and (not output_tax_account or not input_tax_account):
        raise HTTPException(500, "Tax accounts 1004 (Input Tax) and 2101 (Tax Payable) are missing. Run seed.py.")

    if doc.type == DocumentType.VENDOR_BILL:
        lines = [
            {
                "account_id": purchase.id,
                "analytic_account_id": analytic_id,
                "debit": doc.subtotal,
                "credit": ZERO,
            },
            {"account_id": creditor.id, "debit": ZERO, "credit": doc.total},
        ]
        if doc.tax_amount:
            lines.append({"account_id": input_tax_account.id, "debit": doc.tax_amount, "credit": ZERO})
    else:
        lines = [
            {"account_id": debtor.id, "debit": doc.total, "credit": ZERO},
            {
                "account_id": sales.id,
                "analytic_account_id": analytic_id,
                "debit": ZERO,
                "credit": doc.subtotal,
            },
        ]
        if doc.tax_amount:
            lines.append({"account_id": output_tax_account.id, "debit": ZERO, "credit": doc.tax_amount})

    journal = await db.execute(
        select(Journal).where(
            Journal.type == ("Purchase" if doc.type == DocumentType.VENDOR_BILL else "Sales")
        ).limit(1)
    )
    accounting_journal = journal.scalar_one_or_none()

    entry = await create_balanced_entry(
        db,
        entry_date=doc.date,
        reference=f"{doc.type.value} - {str(doc.id)[:8]}",
        journal_id=accounting_journal.id if accounting_journal else None,
        lines=lines,
    )

    # Stock changes only when the accounting document is posted, not when the draft order is created.
    for line in doc.lines:
        product = await db.get(Product, line.product_id, with_for_update=True)
        if not product:
            raise HTTPException(404, f"Product {line.product_id} was not found.")
        if product.type != ProductType.GOODS:
            continue

        if doc.type == DocumentType.VENDOR_BILL:
            product.stock_quantity += line.quantity
        else:
            if product.stock_quantity < line.quantity:
                raise HTTPException(
                    400,
                    f"Not enough stock for {product.name}. Available: {product.stock_quantity}.",
                )
            product.stock_quantity -= line.quantity

    doc.status = DocumentStatus.CONFIRMED
    doc.journal_entry_id = entry.id
    await db.commit()
    await db.refresh(doc)
    return doc


async def register_payment(
    db: AsyncSession,
    document_id: uuid.UUID,
    journal_id: uuid.UUID,
    payment_date: date,
    amount: Decimal,
    reference: str | None = None,
    provider: str = "manual",
    razorpay_order_id: str | None = None,
    razorpay_payment_id: str | None = None,
):
    """Atomically register a partial/full payment and its balanced accounting entry."""
    amount = require_positive_amount(amount)

    result = await db.execute(
        select(TransactionDocument)
        .options(selectinload(TransactionDocument.lines))
        .where(TransactionDocument.id == document_id)
        .with_for_update()
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found.")
    if doc.type not in {DocumentType.VENDOR_BILL, DocumentType.CUSTOMER_INVOICE}:
        raise HTTPException(400, "Payments can only be registered against Vendor Bills or Customer Invoices.")
    if doc.status not in {DocumentStatus.CONFIRMED, DocumentStatus.PARTIALLY_PAID}:
        raise HTTPException(400, "Only Confirmed or Partially Paid documents can be paid.")

    outstanding = money(doc.total - doc.amount_paid)
    if outstanding <= ZERO:
        raise HTTPException(400, "This document is already fully paid.")
    if amount > outstanding:
        raise HTTPException(
            400,
            f"Payment amount ₹{amount} exceeds the outstanding amount ₹{outstanding}.",
        )

    payment_journal = await db.get(Journal, journal_id)
    if not payment_journal:
        raise HTTPException(404, "Payment journal not found.")
    if payment_journal.type not in {"Bank", "Cash"}:
        raise HTTPException(400, "Payment journal must be a Bank or Cash journal.")
    if not payment_journal.default_account_id:
        raise HTTPException(400, "Selected payment journal has no default cash/bank account configured.")

    accounts = await get_account_map(db)
    debtor = accounts.get("1003")
    creditor = accounts.get("2001")
    if not debtor or not creditor:
        raise HTTPException(500, "Debtors/Creditors accounts are missing. Run seed.py.")

    entry_reference = reference or f"Payment {str(uuid.uuid4())[:8]}"
    if len(entry_reference) > 100:
        raise HTTPException(400, "Payment reference must be at most 100 characters.")

    if doc.type == DocumentType.VENDOR_BILL:
        lines = [
            {"account_id": creditor.id, "debit": amount, "credit": ZERO},
            {"account_id": payment_journal.default_account_id, "debit": ZERO, "credit": amount},
        ]
    else:
        lines = [
            {"account_id": payment_journal.default_account_id, "debit": amount, "credit": ZERO},
            {"account_id": debtor.id, "debit": ZERO, "credit": amount},
        ]

    entry = await create_balanced_entry(
        db,
        entry_date=payment_date,
        reference=entry_reference,
        journal_id=payment_journal.id,
        lines=lines,
    )

    payment = Payment(
        document_id=doc.id,
        journal_id=payment_journal.id,
        journal_entry_id=entry.id,
        payment_date=payment_date,
        amount=amount,
        reference=entry_reference,
        provider=provider,
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
    )
    db.add(payment)

    doc.amount_paid = money(doc.amount_paid + amount)
    doc.status = DocumentStatus.PAID if doc.amount_paid == money(doc.total) else DocumentStatus.PARTIALLY_PAID

    await db.commit()
    await db.refresh(doc)
    await db.refresh(payment)
    return payment, doc


def get_razorpay_client() -> razorpay.Client:
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(500, "Razorpay keys are not configured on the server.")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


async def get_or_create_razorpay_journal(db: AsyncSession) -> Journal:
    """Bank journal used to post the accounting entry for online payments."""
    journal = await db.scalar(select(Journal).where(Journal.name == "Razorpay"))
    if journal:
        return journal
    bank_account = (await get_account_map(db)).get("1002")
    if not bank_account:
        raise HTTPException(500, "Bank account (1002) is missing. Run seed.py.")
    journal = Journal(name="Razorpay", type="Bank", default_account_id=bank_account.id)
    db.add(journal)
    await db.flush()
    return journal


async def create_razorpay_order(db: AsyncSession, document_id: uuid.UUID) -> dict:
    """Create a Razorpay order for the full outstanding amount of a document."""
    doc = await db.get(TransactionDocument, document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    if doc.type not in {DocumentType.VENDOR_BILL, DocumentType.CUSTOMER_INVOICE}:
        raise HTTPException(400, "Payments can only be registered against Vendor Bills or Customer Invoices.")
    if doc.status not in {DocumentStatus.CONFIRMED, DocumentStatus.PARTIALLY_PAID}:
        raise HTTPException(400, "Only Confirmed or Partially Paid documents can be paid.")

    outstanding = money(doc.total - doc.amount_paid)
    if outstanding <= ZERO:
        raise HTTPException(400, "This document is already fully paid.")

    client = get_razorpay_client()
    # Razorpay expects the smallest currency unit (paise for INR).
    amount_paise = int((outstanding * 100).to_integral_value())
    order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": str(doc.id),
            "notes": {"document_id": str(doc.id)},
        }
    )
    return order


async def verify_and_register_razorpay_payment(
    db: AsyncSession,
    document_id: uuid.UUID,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    """Verify the Razorpay checkout signature, then post the payment like a manual one."""
    # Idempotent: if this order was already verified (e.g. a retried webhook/callback),
    # return the existing payment instead of erroring or double-posting.
    existing = await db.scalar(select(Payment).where(Payment.razorpay_order_id == razorpay_order_id))
    if existing:
        doc = await db.get(TransactionDocument, existing.document_id)
        return existing, doc

    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(400, "Razorpay signature verification failed.")

    order = client.order.fetch(razorpay_order_id)
    amount = money(Decimal(order["amount"]) / Decimal(100))

    journal = await get_or_create_razorpay_journal(db)
    return await register_payment(
        db,
        document_id=document_id,
        journal_id=journal.id,
        payment_date=date.today(),
        amount=amount,
        reference=f"Razorpay {razorpay_payment_id}",
        provider="razorpay",
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
    )


async def register_pnl_report(
    db: AsyncSession,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Compute P&L dynamically from accounting journal items."""
    query = (
        select(Account.type, func.coalesce(func.sum(JournalItem.debit), 0), func.coalesce(func.sum(JournalItem.credit), 0))
        .join(JournalItem, JournalItem.account_id == Account.id)
        .join(JournalEntry, JournalItem.entry_id == JournalEntry.id)
        .group_by(Account.type)
    )
    if start_date:
        query = query.where(JournalEntry.date >= start_date)
    if end_date:
        query = query.where(JournalEntry.date <= end_date)

    result = await db.execute(query)
    totals = {row[0]: (money(row[1]), money(row[2])) for row in result.all()}
    income_debit, income_credit = totals.get(AccountType.INCOME, (ZERO, ZERO))
    expense_debit, expense_credit = totals.get(AccountType.EXPENSE, (ZERO, ZERO))
    total_income = money(income_credit - income_debit)
    total_expense = money(expense_debit - expense_credit)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": money(total_income - total_expense),
    }


async def register_balance_sheet(
    db: AsyncSession,
    as_of_date: date | None = None,
):
    """Compute Balance Sheet dynamically from all posted journal items up to as_of_date."""
    query = (
        select(Account.type, func.coalesce(func.sum(JournalItem.debit), 0), func.coalesce(func.sum(JournalItem.credit), 0))
        .join(JournalItem, JournalItem.account_id == Account.id)
        .join(JournalEntry, JournalItem.entry_id == JournalEntry.id)
        .group_by(Account.type)
    )
    if as_of_date:
        query = query.where(JournalEntry.date <= as_of_date)

    result = await db.execute(query)
    totals = {row[0]: (money(row[1]), money(row[2])) for row in result.all()}

    debit, credit = totals.get(AccountType.ASSET, (ZERO, ZERO))
    assets = money(debit - credit)
    debit, credit = totals.get(AccountType.LIABILITY, (ZERO, ZERO))
    liabilities = money(credit - debit)
    debit, credit = totals.get(AccountType.EQUITY, (ZERO, ZERO))
    equity = money(credit - debit)

    pnl = await register_pnl_report(db, end_date=as_of_date)
    net_profit = pnl["net_profit"]
    total_liabilities_and_equity = money(liabilities + equity + net_profit)

    return {
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "net_profit": net_profit,
        "total_liabilities_and_equity": total_liabilities_and_equity,
        "balanced": assets == total_liabilities_and_equity,
    }


async def register_account_balances(db: AsyncSession, as_of_date: date | None = None):
    """Return every COA account balance so the dashboard can show the five account classes updating."""
    query = (
        select(
            Account.id,
            Account.code,
            Account.name,
            Account.type,
            func.coalesce(func.sum(JournalItem.debit), 0),
            func.coalesce(func.sum(JournalItem.credit), 0),
        )
        .outerjoin(JournalItem, JournalItem.account_id == Account.id)
        .outerjoin(JournalEntry, JournalItem.entry_id == JournalEntry.id)
        .group_by(Account.id, Account.code, Account.name, Account.type)
        .order_by(Account.code)
    )
    if as_of_date:
        query = query.where((JournalEntry.id.is_(None)) | (JournalEntry.date <= as_of_date))

    result = await db.execute(query)
    rows = []
    for account_id, code, name, account_type, debit, credit in result.all():
        debit, credit = money(debit), money(credit)
        if account_type in {AccountType.ASSET, AccountType.EXPENSE}:
            balance = money(debit - credit)
        else:
            balance = money(credit - debit)
        rows.append({
            "id": account_id,
            "code": code,
            "name": name,
            "type": account_type,
            "debit": debit,
            "credit": credit,
            "balance": balance,
        })
    return rows


async def register_budget_report(db: AsyncSession, as_of_date: date | None = None):
    """Compute budget actuals from analytic journal items, not from manually stored values."""
    budgets_result = await db.execute(select(Budget).options(selectinload(Budget.analytic_account)))
    budgets = budgets_result.scalars().all()

    rows = []
    for budget in budgets:
        effective_end = budget.period_end
        if as_of_date:
            if as_of_date < budget.period_start:
                actual = ZERO
            else:
                effective_end = min(budget.period_end, as_of_date)
                actual = await _analytic_actual(db, budget.analytic_account_id, budget.period_start, effective_end, budget.analytic_account.type)
        else:
            actual = await _analytic_actual(db, budget.analytic_account_id, budget.period_start, effective_end, budget.analytic_account.type)

        planned = money(budget.planned_amount)
        variance = money(planned - actual)
        utilization = money((actual / planned * Decimal("100")) if planned else ZERO)
        rows.append({
            "id": budget.id,
            "name": budget.name,
            "analytic_account_id": budget.analytic_account_id,
            "analytic_account_name": budget.analytic_account.name if budget.analytic_account else None,
            "period_start": budget.period_start,
            "period_end": budget.period_end,
            "responsible_person": budget.responsible_person,
            "planned": planned,
            "actual": actual,
            "variance": variance,
            "utilization_percent": utilization,
        })
    return rows


async def _analytic_actual(
    db: AsyncSession,
    analytic_account_id: uuid.UUID,
    start_date: date,
    end_date: date,
    analytic_type: AnalyticType,
) -> Decimal:
    result = await db.execute(
        select(Account.type, JournalItem.debit, JournalItem.credit)
        .join(Account, JournalItem.account_id == Account.id)
        .join(JournalEntry, JournalItem.entry_id == JournalEntry.id)
        .where(
            JournalItem.analytic_account_id == analytic_account_id,
            JournalEntry.date >= start_date,
            JournalEntry.date <= end_date,
        )
    )
    actual = ZERO
    for account_type, debit, credit in result.all():
        debit, credit = money(debit), money(credit)
        if analytic_type == AnalyticType.INCOME:
            actual += credit - debit
        elif account_type == AccountType.EXPENSE:
            actual += debit - credit
        else:
            actual += debit - credit
    return money(actual)