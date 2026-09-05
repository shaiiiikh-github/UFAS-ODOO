import uuid
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.domain import TransactionDocument, DocumentStatus, DocumentType
from app.models.accounting import JournalEntry, JournalItem, Account, AccountType

async def confirm_transaction_document(db: AsyncSession, document_id: uuid.UUID):
    """
    Business Logic: Converts a Bill/Invoice into an accounting Journal Entry.
    Applies strict double-entry debits and credits based on the document type.
    """
    # Fetch Document
    result = await db.execute(select(TransactionDocument).where(TransactionDocument.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT documents can be confirmed")

    # Only create financial entries for Invoices and Bills (Orders don't affect the ledger yet)
    if doc.type in [DocumentType.PURCHASE_ORDER, DocumentType.SALES_ORDER]:
        doc.status = DocumentStatus.CONFIRMED
        await db.commit()
        return doc

    # Fetch required ledger accounts (seeded via seed.py)
    accounts_query = await db.execute(select(Account).where(Account.code.in_(["1003", "2001", "4001", "5001"])))
    accounts = {acc.code: acc.id for acc in accounts_query.scalars().all()}

    # Create the Header Journal Entry
    journal_entry = JournalEntry(
        date=doc.date,
        reference=f"{doc.type.value} - {str(doc.id)[:8]}",
        narration=f"Automated entry for {doc.type.value}"
    )
    db.add(journal_entry)
    await db.flush() # Flush to get the journal_entry.id

    # Create Double-Entry Lines
    if doc.type == DocumentType.CUSTOMER_INVOICE:
        # Debit: Accounts Receivable (1003) | Credit: Sales Income (4001)
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1003"], debit=doc.total, credit=Decimal("0.00")))
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["4001"], debit=Decimal("0.00"), credit=doc.total))
    
    elif doc.type == DocumentType.VENDOR_BILL:
        # Debit: Purchase Expense (5001) | Credit: Accounts Payable (2001)
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["5001"], debit=doc.total, credit=Decimal("0.00")))
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["2001"], debit=Decimal("0.00"), credit=doc.total))

    # Update Document status and link entry
    doc.status = DocumentStatus.CONFIRMED
    doc.journal_entry_id = journal_entry.id
    
    await db.commit()
    await db.refresh(doc)
    return doc

async def generate_pnl_report(db: AsyncSession):
    """Calculates Income vs Expenses"""
    query = select(Account.type, func.sum(JournalItem.credit) - func.sum(JournalItem.debit)).join(JournalItem).group_by(Account.type)
    result = await db.execute(query)
    balances = {row[0]: row[1] or Decimal("0.00") for row in result.all()}

    income = balances.get(AccountType.INCOME, Decimal("0.00"))
    # Expenses have debit balances, so (credit - debit) will be negative. We negate it to show positive expense total.
    expense = balances.get(AccountType.EXPENSE, Decimal("0.00")) * -1 
    
    net_profit = income - expense
    return {"total_income": income, "total_expense": expense, "net_profit": net_profit}

async def generate_balance_sheet(db: AsyncSession):
    """Calculates Assets = Liabilities + Equity"""
    # 1. Get Net Profit from PnL
    pnl = await generate_pnl_report(db)
    net_profit = pnl["net_profit"]

    # 2. Get Balances
    query = select(Account.type, func.sum(JournalItem.debit) - func.sum(JournalItem.credit)).join(JournalItem).group_by(Account.type)
    result = await db.execute(query)
    balances = {row[0]: row[1] or Decimal("0.00") for row in result.all()}

    # Assets are Debit normal
    assets = balances.get(AccountType.ASSET, Decimal("0.00"))
    # Liabilities and Equity are Credit normal (so we negate the debit-credit result)
    liabilities = balances.get(AccountType.LIABILITY, Decimal("0.00")) * -1
    equity = balances.get(AccountType.EQUITY, Decimal("0.00")) * -1

    return {
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "net_profit": net_profit,
        "total_liabilities_and_equity": liabilities + equity + net_profit
    }