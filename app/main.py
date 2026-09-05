from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.core.database import get_db
from app.models.domain import Contact, Product, TransactionDocument, DocumentLine
from app.schemas import (
    ContactCreate, ContactResponse, ProductCreate, ProductResponse,
    DocumentCreate, DocumentResponse, BalanceSheetResponse, PnLResponse
)
from app.services import confirm_transaction_document, generate_balance_sheet, generate_pnl_report

app = FastAPI(title="Urban Furniture Accounting System", version="1.0.0")

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
    # Calculate line subtotals and document total
    total = sum(line.quantity * line.unit_price for line in doc_in.lines)
    
    db_doc = TransactionDocument(
        contact_id=doc_in.contact_id,
        type=doc_in.type,
        date=doc_in.date,
        total=total
    )
    db.add(db_doc)
    await db.flush() # Flush to get db_doc.id

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
    
    # Reload with lines eagerly loaded for the response
    result = await db.execute(select(TransactionDocument).options(selectinload(TransactionDocument.lines)).where(TransactionDocument.id == db_doc.id))
    return result.scalar_one()

@app.post("/api/documents/{document_id}/confirm", response_model=DocumentResponse, tags=["Transactions"])
async def confirm_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # This calls our business logic engine to post the accounting journal entries!
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