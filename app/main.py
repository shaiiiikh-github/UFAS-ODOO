from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from decimal import Decimal
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import get_db

from app.models.domain import (
    Contact, Product, TransactionDocument, DocumentLine, 
    DocumentType, DocumentStatus
)
from app.models.accounting import (
    JournalEntry, JournalItem, Account, 
    AnalyticAccount, Budget
)
from app.schemas import (
    ContactCreate, ContactResponse, ProductCreate, ProductResponse,
    DocumentCreate, DocumentResponse, BalanceSheetResponse, PnLResponse,
    PaymentCreate, PaymentResponse, AnalyticAccountCreate, 
    AnalyticAccountResponse, BudgetCreate, BudgetResponse
)
from app.services import confirm_transaction_document, generate_balance_sheet, generate_pnl_report
from app.routers import gateway

app = FastAPI(title="Urban Furniture Accounting System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Payment Gateway Router
app.include_router(gateway.router)

# --- Contacts API ---
@app.post("/api/contacts/", response_model=ContactResponse, tags=["Master Data"])
async def create_contact(contact: ContactCreate, db: AsyncSession = Depends(get_db)):
    db_contact = Contact(**contact.model_dump())
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    return db_contact

@app.get("/api/contacts/", response_model=List[ContactResponse], tags=["Master Data"])
async def get_contacts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contact))
    return result.scalars().all()

# --- Products API ---
@app.post("/api/products/", response_model=ProductResponse, tags=["Master Data"])
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@app.get("/api/products/", response_model=List[ProductResponse], tags=["Master Data"])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    return result.scalars().all()

# --- Transactions API ---
@app.post("/api/documents/", response_model=DocumentResponse, tags=["Transactions"])
async def create_document(doc_in: DocumentCreate, db: AsyncSession = Depends(get_db)):
    total = sum(line.quantity * line.unit_price for line in doc_in.lines)
    
    db_doc = TransactionDocument(
        contact_id=doc_in.contact_id,
        type=doc_in.type,
        date=doc_in.date,
        total=total
    )
    db.add(db_doc)
    await db.flush()

    for line in doc_in.lines:
        db_line = DocumentLine(
            document_id=db_doc.id,
            product_id=line.product_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            subtotal=line.quantity * line.unit_price
        )
        db.add(db_line)
        
    await db.commit()
    
    result = await db.execute(select(TransactionDocument).options(selectinload(TransactionDocument.lines)).where(TransactionDocument.id == db_doc.id))
    return result.scalar_one()

@app.post("/api/documents/{document_id}/confirm", response_model=DocumentResponse, tags=["Transactions"])
async def confirm_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await confirm_transaction_document(db, document_id)
    result = await db.execute(select(TransactionDocument).options(selectinload(TransactionDocument.lines)).where(TransactionDocument.id == document_id))
    return result.scalar_one()

# --- Financial Reports API ---
@app.get("/api/reports/pnl", response_model=PnLResponse, tags=["Reporting"])
async def get_profit_and_loss(db: AsyncSession = Depends(get_db)):
    return await generate_pnl_report(db)

@app.get("/api/reports/balance-sheet", response_model=BalanceSheetResponse, tags=["Reporting"])
async def get_balance_sheet(db: AsyncSession = Depends(get_db)):
    return await generate_balance_sheet(db)

# --- Manual Payments API ---
@app.post("/api/payments/", response_model=PaymentResponse, tags=["Transactions"])
async def register_payment(payment: PaymentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TransactionDocument).where(TransactionDocument.id == payment.document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Only CONFIRMED documents can be paid")

    accounts_query = await db.execute(select(Account).where(Account.code.in_(["1001", "1003", "2001"])))
    accounts = {acc.code: acc.id for acc in accounts_query.scalars().all()}

    journal_entry = JournalEntry(
        date=doc.date,
        reference=f"PAY-{str(doc.id)[:8]}",
        narration=f"Payment received via {payment.payment_method}"
    )
    db.add(journal_entry)
    await db.flush()

    if doc.type == DocumentType.CUSTOMER_INVOICE:
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1001"], debit=payment.amount, credit=Decimal("0.00")))
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1003"], debit=Decimal("0.00"), credit=payment.amount))
    elif doc.type == DocumentType.VENDOR_BILL:
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["2001"], debit=payment.amount, credit=Decimal("0.00")))
        db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1001"], debit=Decimal("0.00"), credit=payment.amount))

    doc.status = DocumentStatus.PAID
    await db.commit()
    return {"message": "Payment recorded and ledger updated.", "document_status": doc.status}

# --- Budgets & Analytics API ---
@app.post("/api/analytics/", response_model=AnalyticAccountResponse, tags=["Budgets & Analytics"])
async def create_analytic_account(account: AnalyticAccountCreate, db: AsyncSession = Depends(get_db)):
    db_account = AnalyticAccount(**account.model_dump())
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account

@app.get("/api/analytics/", response_model=List[AnalyticAccountResponse], tags=["Budgets & Analytics"])
async def get_analytic_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AnalyticAccount))
    return result.scalars().all()

@app.post("/api/budgets/", response_model=BudgetResponse, tags=["Budgets & Analytics"])
async def create_budget(budget: BudgetCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AnalyticAccount).where(AnalyticAccount.id == budget.analytic_account_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Analytic Account not found")

    db_budget = Budget(**budget.model_dump())
    db.add(db_budget)
    await db.commit()
    await db.refresh(db_budget)
    return db_budget

@app.get("/api/budgets/", response_model=List[BudgetResponse], tags=["Budgets & Analytics"])
async def get_budgets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Budget))
    return result.scalars().all()