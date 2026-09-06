from datetime import date
from decimal import Decimal
from typing import List
import os
import shutil
import uuid

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_staff, require_any
from app.core.security import create_access_token, hash_password, verify_password
from app.models.auth import User, UserRole
from app.models.domain import Contact, Product, TransactionDocument, DocumentLine, DocumentType, DocumentStatus
from app.models.accounting import Account, AnalyticAccount, Budget, Journal, JournalEntry, JournalItem, Payment
from app.schemas import (
    ContactCreate, ContactUpdate, ContactResponse, ProductCreate, ProductUpdate, ProductResponse,
    StockReportRow,
    DocumentCreate, DocumentUpdate, DocumentResponse, BalanceSheetResponse, PnLResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentListResponse,
    RazorpayOrderCreate, RazorpayOrderResponse, RazorpayVerifyRequest,
    AnalyticAccountCreate, AnalyticAccountUpdate, AnalyticAccountResponse,
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetReportRow,
    AccountCreate, AccountUpdate, AccountResponse,
    JournalCreate, JournalUpdate, JournalResponse, AccountBalanceResponse, JournalEntryResponse, JournalItemResponse,
    JournalEntryCreate, JournalEntryUpdate,
    UserCreate, UserResponse, LoginRequest, TokenResponse,
)
from app.services import (
    confirm_transaction_document,
    register_pnl_report,
    register_balance_sheet,
    register_account_balances,
    register_budget_report,
    register_payment,
    create_razorpay_order,
    verify_and_register_razorpay_payment,
    update_document as svc_update_document,
    delete_document as svc_delete_document,
    cancel_document as svc_cancel_document,
    create_manual_journal_entry,
    update_manual_journal_entry,
    post_manual_journal_entry,
    cancel_manual_journal_entry,
    create_draft_payment,
    update_payment as svc_update_payment,
    post_payment as svc_post_payment,
    cancel_payment as svc_cancel_payment,
)

app = FastAPI(title="Urban Furniture Accounting System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/uploads/contacts", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


def validate_report_dates(start_date: date | None, end_date: date | None):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(400, "end_date cannot be earlier than start_date.")


def document_response(doc: TransactionDocument) -> DocumentResponse:
    return DocumentResponse.from_document(doc)


def assert_contact_owns_document(current_user: User, doc: TransactionDocument):
    """A Contact-role user may only see/act on documents addressed to their own Contact record."""
    if current_user.role == UserRole.CONTACT and doc.contact_id != current_user.contact_id:
        raise HTTPException(403, "You may only access your own invoices and bills.")


# ---------------- Auth ----------------
@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password.")
    token = create_access_token(user_id=user.id, role=user.role.value, contact_id=user.contact_id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse, tags=["Auth"])
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/api/auth/users", response_model=UserResponse, tags=["Auth"])
async def create_staff_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: provision another Admin or Accountant (Invoicing User) login."""
    existing = await db.scalar(select(User).where(User.email == user_in.email.lower()))
    if existing:
        raise HTTPException(400, "A user with this email already exists.")
    db_user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@app.get("/api/auth/users", response_model=List[UserResponse], tags=["Auth"])
async def list_staff_users(db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()


# ---------------- Contacts ----------------
@app.post("/api/contacts/", response_model=ContactResponse, tags=["Master Data"])
async def create_contact(
    contact: ContactCreate,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    payload = contact.model_dump(exclude={"create_portal_user", "portal_password"})
    db_contact = Contact(**payload)
    db.add(db_contact)
    await db.flush()

    if contact.create_portal_user:
        if not contact.email:
            raise HTTPException(400, "A contact needs an email to create a portal login.")
        if not contact.portal_password:
            raise HTTPException(400, "portal_password is required to create a portal login.")
        existing = await db.scalar(select(User).where(User.email == contact.email.lower()))
        if existing:
            raise HTTPException(400, "A user with this email already exists.")
        db.add(User(
            name=contact.name,
            email=contact.email.lower(),
            hashed_password=hash_password(contact.portal_password),
            role=UserRole.CONTACT,
            contact_id=db_contact.id,
        ))

    await db.commit()
    await db.refresh(db_contact)
    return db_contact


@app.get("/api/contacts/", response_model=List[ContactResponse], tags=["Master Data"])
async def get_contacts(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    stmt = select(Contact).order_by(Contact.name)
    if not include_archived:
        stmt = stmt.where(Contact.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@app.put("/api/contacts/{contact_id}", response_model=ContactResponse, tags=["Master Data"])
async def update_contact(
    contact_id: uuid.UUID,
    contact_in: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db_contact = await db.get(Contact, contact_id)
    if not db_contact:
        raise HTTPException(404, "Contact not found.")
    for field, value in contact_in.model_dump(exclude_unset=True).items():
        setattr(db_contact, field, value)
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


@app.post("/api/contacts/{contact_id}/archive", response_model=ContactResponse, tags=["Master Data"])
async def archive_contact(
    contact_id: uuid.UUID,
    restore: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db_contact = await db.get(Contact, contact_id)
    if not db_contact:
        raise HTTPException(404, "Contact not found.")
    db_contact.is_active = restore
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


@app.post("/api/contacts/{contact_id}/profile-image", response_model=ContactResponse, tags=["Master Data"])
async def upload_contact_profile_image(
    contact_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    db_contact = await db.get(Contact, contact_id)
    if not db_contact:
        raise HTTPException(404, "Contact not found.")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise HTTPException(400, "Unsupported image type. Use png, jpg, jpeg, webp, or gif.")
    dest_path = os.path.join("static", "uploads", "contacts", f"{contact_id}{ext}")
    with open(dest_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)
    db_contact.profile_image_url = f"/static/uploads/contacts/{contact_id}{ext}"
    await db.commit()
    await db.refresh(db_contact)
    return db_contact


# ---------------- Products ----------------
@app.post("/api/products/", response_model=ProductResponse, tags=["Master Data"])
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


@app.get("/api/products/", response_model=List[ProductResponse], tags=["Master Data"])
async def get_products(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    stmt = select(Product).order_by(Product.name)
    if not include_archived:
        stmt = stmt.where(Product.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@app.put("/api/products/{product_id}", response_model=ProductResponse, tags=["Master Data"])
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(404, "Product not found.")
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)
    await db.commit()
    await db.refresh(db_product)
    return db_product


@app.post("/api/products/{product_id}/archive", response_model=ProductResponse, tags=["Master Data"])
async def archive_product(
    product_id: uuid.UUID,
    restore: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(404, "Product not found.")
    db_product.is_active = restore
    await db.commit()
    await db.refresh(db_product)
    return db_product


# ---------------- Chart of Accounts ----------------
@app.post("/api/chart-of-accounts/", response_model=AccountResponse, tags=["Accounting"])
async def create_account(account: AccountCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    existing = await db.scalar(select(Account).where(Account.code == account.code))
    if existing:
        raise HTTPException(400, "An account with this code already exists.")
    db_account = Account(**account.model_dump())
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@app.get("/api/chart-of-accounts/", response_model=List[AccountResponse], tags=["Accounting"])
async def list_chart_of_accounts(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    stmt = select(Account).order_by(Account.code)
    if not include_archived:
        stmt = stmt.where(Account.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@app.put("/api/chart-of-accounts/{account_id}", response_model=AccountResponse, tags=["Accounting"])
async def update_account(account_id: uuid.UUID, account_in: AccountUpdate, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_account = await db.get(Account, account_id)
    if not db_account:
        raise HTTPException(404, "Account not found.")
    for field, value in account_in.model_dump(exclude_unset=True).items():
        setattr(db_account, field, value)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@app.post("/api/chart-of-accounts/{account_id}/archive", response_model=AccountResponse, tags=["Accounting"])
async def archive_account(account_id: uuid.UUID, restore: bool = Query(default=False), db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_account = await db.get(Account, account_id)
    if not db_account:
        raise HTTPException(404, "Account not found.")
    db_account.is_active = restore
    await db.commit()
    await db.refresh(db_account)
    return db_account


# ---------------- Journals ----------------
@app.post("/api/journals/", response_model=JournalResponse, tags=["Accounting"])
async def create_journal(journal: JournalCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    db_journal = Journal(**journal.model_dump())
    db.add(db_journal)
    await db.commit()
    await db.refresh(db_journal)
    result = await db.execute(select(Journal).options(selectinload(Journal.default_account)).where(Journal.id == db_journal.id))
    j = result.scalar_one()
    return JournalResponse(id=j.id, name=j.name, type=j.type, default_account_id=j.default_account_id, default_account_name=j.default_account.name if j.default_account else None, is_active=j.is_active)


@app.get("/api/journals/", response_model=List[JournalResponse], tags=["Accounting"])
async def get_journals(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_any),
):
    stmt = select(Journal).options(selectinload(Journal.default_account)).order_by(Journal.name)
    if not include_archived:
        stmt = stmt.where(Journal.is_active.is_(True))
    result = await db.execute(stmt)
    journals = result.scalars().all()
    return [
        JournalResponse(
            id=j.id,
            name=j.name,
            type=j.type,
            default_account_id=j.default_account_id,
            default_account_name=j.default_account.name if j.default_account else None,
            is_active=j.is_active,
        )
        for j in journals
    ]


@app.put("/api/journals/{journal_id}", response_model=JournalResponse, tags=["Accounting"])
async def update_journal(journal_id: uuid.UUID, journal_in: JournalUpdate, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_journal = await db.get(Journal, journal_id)
    if not db_journal:
        raise HTTPException(404, "Journal not found.")
    for field, value in journal_in.model_dump(exclude_unset=True).items():
        setattr(db_journal, field, value)
    await db.commit()
    await db.refresh(db_journal)
    result = await db.execute(select(Journal).options(selectinload(Journal.default_account)).where(Journal.id == db_journal.id))
    j = result.scalar_one()
    return JournalResponse(id=j.id, name=j.name, type=j.type, default_account_id=j.default_account_id, default_account_name=j.default_account.name if j.default_account else None, is_active=j.is_active)


@app.post("/api/journals/{journal_id}/archive", response_model=JournalResponse, tags=["Accounting"])
async def archive_journal(journal_id: uuid.UUID, restore: bool = Query(default=False), db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_journal = await db.get(Journal, journal_id)
    if not db_journal:
        raise HTTPException(404, "Journal not found.")
    db_journal.is_active = restore
    await db.commit()
    await db.refresh(db_journal)
    result = await db.execute(select(Journal).options(selectinload(Journal.default_account)).where(Journal.id == db_journal.id))
    j = result.scalar_one()
    return JournalResponse(id=j.id, name=j.name, type=j.type, default_account_id=j.default_account_id, default_account_name=j.default_account.name if j.default_account else None, is_active=j.is_active)


@app.get("/api/accounts/", response_model=List[AccountBalanceResponse], tags=["Accounting"])
async def get_account_balances(
    as_of_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    return await register_account_balances(db, as_of_date)


# ---------------- Transactions ----------------
@app.post("/api/documents/", response_model=DocumentResponse, tags=["Transactions"])
async def create_document(doc_in: DocumentCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    contact = await db.get(Contact, doc_in.contact_id)
    if not contact:
        raise HTTPException(404, "Contact not found.")

    if doc_in.type in {DocumentType.VENDOR_BILL, DocumentType.PURCHASE_ORDER} and contact.type.value not in {"Vendor", "Both"}:
        raise HTTPException(400, "This document requires a Vendor or Both contact.")
    if doc_in.type in {DocumentType.CUSTOMER_INVOICE, DocumentType.SALES_ORDER} and contact.type.value not in {"Customer", "Both"}:
        raise HTTPException(400, "This document requires a Customer or Both contact.")

    subtotal_sum = Decimal("0.00")
    tax_sum = Decimal("0.00")
    line_computations = []

    for line in doc_in.lines:
        product = await db.get(Product, line.product_id)
        if not product:
            raise HTTPException(404, f"Product {line.product_id} not found.")
        line_subtotal = (Decimal(line.quantity) * line.unit_price).quantize(Decimal("0.01"))
        line_tax = (line_subtotal * line.tax_rate / Decimal("100.00")).quantize(Decimal("0.01"))
        subtotal_sum += line_subtotal
        tax_sum += line_tax
        line_computations.append((line, line_subtotal))

    total_sum = subtotal_sum + tax_sum
    db_doc = TransactionDocument(
        contact_id=doc_in.contact_id,
        type=doc_in.type,
        date=doc_in.date,
        due_date=doc_in.due_date,
        subtotal=subtotal_sum,
        tax_amount=tax_sum,
        total=total_sum,
        status=DocumentStatus.DRAFT,
    )
    db.add(db_doc)
    await db.flush()

    for line, line_subtotal in line_computations:
        db.add(DocumentLine(
            document_id=db_doc.id,
            product_id=line.product_id,
            analytic_account_id=line.analytic_account_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            tax_rate=line.tax_rate,
            subtotal=line_subtotal,
        ))

    await db.commit()
    result = await db.execute(
        select(TransactionDocument)
        .options(selectinload(TransactionDocument.lines).selectinload(DocumentLine.product), selectinload(TransactionDocument.contact))
        .where(TransactionDocument.id == db_doc.id)
    )
    return document_response(result.scalar_one())


@app.get("/api/documents/", response_model=List[DocumentResponse], tags=["Transactions"])
async def get_documents(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_any)):
    """Admin/Accountant see every document. A Contact user only sees documents addressed to them."""
    stmt = (
        select(TransactionDocument)
        .options(selectinload(TransactionDocument.lines).selectinload(DocumentLine.product), selectinload(TransactionDocument.contact))
        .order_by(TransactionDocument.date.desc(), TransactionDocument.created_at.desc())
    )
    if current_user.role == UserRole.CONTACT:
        stmt = stmt.where(TransactionDocument.contact_id == current_user.contact_id)
    result = await db.execute(stmt)
    return [document_response(doc) for doc in result.scalars().all()]


@app.post("/api/documents/{document_id}/convert", response_model=DocumentResponse, tags=["Transactions"])
async def convert_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    result = await db.execute(
        select(TransactionDocument)
        .options(selectinload(TransactionDocument.lines).selectinload(DocumentLine.product), selectinload(TransactionDocument.contact))
        .where(TransactionDocument.id == document_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Document not found.")
    if source.type not in {DocumentType.PURCHASE_ORDER, DocumentType.SALES_ORDER}:
        raise HTTPException(400, "Only Purchase Orders and Sales Orders can be converted.")
    if source.status != DocumentStatus.DRAFT:
        raise HTTPException(400, "Only Draft orders can be converted.")

    target_type = DocumentType.VENDOR_BILL if source.type == DocumentType.PURCHASE_ORDER else DocumentType.CUSTOMER_INVOICE
    target = TransactionDocument(
        contact_id=source.contact_id,
        type=target_type,
        date=source.date,
        due_date=source.due_date,
        source_document_id=source.id,
        subtotal=source.subtotal,
        tax_amount=source.tax_amount,
        total=source.total,
        status=DocumentStatus.DRAFT,
    )
    db.add(target)
    await db.flush()
    for line in source.lines:
        db.add(DocumentLine(
            document_id=target.id,
            product_id=line.product_id,
            analytic_account_id=line.analytic_account_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            tax_rate=line.tax_rate,
            subtotal=line.subtotal,
        ))
    source.status = DocumentStatus.CONFIRMED
    await db.commit()

    result = await db.execute(
        select(TransactionDocument).options(selectinload(TransactionDocument.lines).selectinload(DocumentLine.product), selectinload(TransactionDocument.contact)).where(TransactionDocument.id == target.id)
    )
    return document_response(result.scalar_one())


@app.post("/api/documents/{document_id}/confirm", response_model=DocumentResponse, tags=["Transactions"])
async def confirm_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        await confirm_transaction_document(db, document_id)
    except Exception:
        await db.rollback()
        raise
    result = await db.execute(
        select(TransactionDocument)
        .options(selectinload(TransactionDocument.lines).selectinload(DocumentLine.product), selectinload(TransactionDocument.contact))
        .where(TransactionDocument.id == document_id)
    )
    return document_response(result.scalar_one())


# ---------------- Payments ----------------
@app.post("/api/payments/", response_model=PaymentListResponse, tags=["Transactions"])
async def create_payment(payment: PaymentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_any)):
    """Create a DRAFT payment against a Vendor Bill / Customer Invoice. Post it separately to affect the ledger."""
    if current_user.role == UserRole.CONTACT:
        target_doc = await db.get(TransactionDocument, payment.document_id)
        if not target_doc or target_doc.contact_id != current_user.contact_id:
            raise HTTPException(403, "You may only pay your own invoices and bills.")
    try:
        record = await create_draft_payment(
            db, payment.document_id, payment.journal_id, payment.payment_date,
            payment.amount, payment.reference, payment.method,
        )
    except Exception:
        await db.rollback()
        raise
    return record


@app.post("/api/payments/razorpay/order", response_model=RazorpayOrderResponse, tags=["Transactions"])
async def create_razorpay_order_endpoint(
    body: RazorpayOrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_any)
):
    """Create a Razorpay order for the outstanding amount of a document. Called before opening checkout."""
    doc = await db.get(TransactionDocument, body.document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    assert_contact_owns_document(current_user, doc)

    order = await create_razorpay_order(db, body.document_id)
    return RazorpayOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=settings.RAZORPAY_KEY_ID,
    )


@app.post("/api/payments/razorpay/verify", response_model=PaymentResponse, tags=["Transactions"])
async def verify_razorpay_payment_endpoint(
    body: RazorpayVerifyRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_any)
):
    """Verify the signature returned by Razorpay checkout, then post the payment + accounting entry."""
    doc = await db.get(TransactionDocument, body.document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    assert_contact_owns_document(current_user, doc)

    try:
        payment_record, updated_doc = await verify_and_register_razorpay_payment(
            db,
            body.document_id,
            body.razorpay_order_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
        )
    except Exception:
        await db.rollback()
        raise

    return PaymentResponse(
        message="Payment verified and accounting entry posted.",
        payment_id=payment_record.id,
        document_id=updated_doc.id,
        document_status=updated_doc.status,
        payment_amount=payment_record.amount,
        total_paid=updated_doc.amount_paid,
        outstanding_amount=max(Decimal("0.00"), updated_doc.total - updated_doc.amount_paid),
        journal_entry_id=payment_record.journal_entry_id,
    )


@app.get("/api/payments/", response_model=List[PaymentListResponse], tags=["Transactions"])
async def get_payments(db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    result = await db.execute(select(Payment).order_by(Payment.payment_date.desc(), Payment.created_at.desc()))
    return result.scalars().all()


@app.get("/api/documents/{document_id}/payments", response_model=List[PaymentListResponse], tags=["Transactions"])
async def get_document_payments(document_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_any)):
    doc = await db.get(TransactionDocument, document_id)
    if not doc:
        raise HTTPException(404, "Document not found.")
    assert_contact_owns_document(current_user, doc)
    result = await db.execute(
        select(Payment)
        .where(Payment.document_id == document_id)
        .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
    )
    return result.scalars().all()


# ---------------- Financial Reports ----------------
@app.get("/api/reports/pnl", response_model=PnLResponse, tags=["Reporting"])
async def get_profit_and_loss(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    validate_report_dates(start_date, end_date)
    return await register_pnl_report(db, start_date, end_date)


@app.get("/api/reports/balance-sheet", response_model=BalanceSheetResponse, tags=["Reporting"])
async def get_balance_sheet(
    as_of_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    return await register_balance_sheet(db, as_of_date)


@app.get("/api/reports/budget", response_model=List[BudgetReportRow], tags=["Reporting"])
async def get_budget_report(
    as_of_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    return await register_budget_report(db, as_of_date)


@app.get("/api/reports/account-balances", response_model=List[AccountBalanceResponse], tags=["Reporting"])
async def get_report_account_balances(
    as_of_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    return await register_account_balances(db, as_of_date)


@app.get("/api/reports/stock", response_model=List[StockReportRow], tags=["Reporting"])
async def get_stock_report(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    """Stock report: quantity on hand and stock valuation (at cost) per product."""
    stmt = select(Product).order_by(Product.category, Product.name)
    if not include_archived:
        stmt = stmt.where(Product.is_active.is_(True))
    result = await db.execute(stmt)
    products = result.scalars().all()
    return [
        StockReportRow(
            id=p.id,
            name=p.name,
            type=p.type,
            category=p.category,
            stock_quantity=p.stock_quantity,
            cost=p.cost,
            sales_price=p.sales_price,
            stock_value_at_cost=(Decimal(p.stock_quantity) * p.cost).quantize(Decimal("0.01")),
            is_active=p.is_active,
        )
        for p in products
    ]


# ---------------- Journal Entries ----------------
@app.get("/api/journal-entries/", response_model=List[JournalEntryResponse], tags=["Accounting"])
async def get_journal_entries(db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    result = await db.execute(
        select(JournalEntry)
        .options(selectinload(JournalEntry.items).selectinload(JournalItem.account), selectinload(JournalEntry.items).selectinload(JournalItem.analytic_account), selectinload(JournalEntry.journal))
        .order_by(JournalEntry.date.desc(), JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()
    response = []
    for entry in entries:
        total_debit = sum((item.debit for item in entry.items), Decimal("0.00"))
        total_credit = sum((item.credit for item in entry.items), Decimal("0.00"))
        response.append(JournalEntryResponse(
            id=entry.id,
            date=entry.date,
            reference=entry.reference,
            status=entry.status,
            journal_id=entry.journal_id,
            journal_name=entry.journal.name if entry.journal else None,
            total_debit=total_debit,
            total_credit=total_credit,
            balanced=total_debit == total_credit,
            items=[JournalItemResponse(
                id=item.id,
                entry_id=item.entry_id,
                account_id=item.account_id,
                account_code=item.account.code,
                account_name=item.account.name,
                account_type=item.account.type,
                analytic_account_id=item.analytic_account_id,
                debit=item.debit,
                credit=item.credit,
            ) for item in entry.items],
        ))
    return response


# ---------------- Budgets & Analytics ----------------
@app.post("/api/analytics/", response_model=AnalyticAccountResponse, tags=["Budgets & Analytics"])
async def create_analytic_account(account: AnalyticAccountCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    db_account = AnalyticAccount(**account.model_dump())
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@app.get("/api/analytics/", response_model=List[AnalyticAccountResponse], tags=["Budgets & Analytics"])
async def get_analytic_accounts(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    stmt = select(AnalyticAccount).order_by(AnalyticAccount.name)
    if not include_archived:
        stmt = stmt.where(AnalyticAccount.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


# Backward-compatible alias for the existing frontend/client.
@app.get("/api/analytic-accounts/", response_model=List[AnalyticAccountResponse], include_in_schema=False)
async def get_analytic_accounts_legacy(db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    return await get_analytic_accounts(db=db, _staff=_staff)


@app.put("/api/analytics/{account_id}", response_model=AnalyticAccountResponse, tags=["Budgets & Analytics"])
async def update_analytic_account(account_id: uuid.UUID, account_in: AnalyticAccountUpdate, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_account = await db.get(AnalyticAccount, account_id)
    if not db_account:
        raise HTTPException(404, "Analytic Account not found.")
    for field, value in account_in.model_dump(exclude_unset=True).items():
        setattr(db_account, field, value)
    await db.commit()
    await db.refresh(db_account)
    return db_account


@app.post("/api/analytics/{account_id}/archive", response_model=AnalyticAccountResponse, tags=["Budgets & Analytics"])
async def archive_analytic_account(account_id: uuid.UUID, restore: bool = Query(default=False), db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_account = await db.get(AnalyticAccount, account_id)
    if not db_account:
        raise HTTPException(404, "Analytic Account not found.")
    db_account.is_active = restore
    await db.commit()
    await db.refresh(db_account)
    return db_account


@app.post("/api/budgets/", response_model=BudgetResponse, tags=["Budgets & Analytics"])
async def create_budget(budget: BudgetCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    result = await db.execute(select(AnalyticAccount).where(AnalyticAccount.id == budget.analytic_account_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Analytic Account not found")
    db_budget = Budget(**budget.model_dump())
    db.add(db_budget)
    await db.commit()
    await db.refresh(db_budget)
    return db_budget


@app.get("/api/budgets/", response_model=List[BudgetResponse], tags=["Budgets & Analytics"])
async def get_budgets(
    include_archived: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    stmt = select(Budget).order_by(Budget.period_start.desc())
    if not include_archived:
        stmt = stmt.where(Budget.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@app.put("/api/budgets/{budget_id}", response_model=BudgetResponse, tags=["Budgets & Analytics"])
async def update_budget(budget_id: uuid.UUID, budget_in: BudgetUpdate, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_budget = await db.get(Budget, budget_id)
    if not db_budget:
        raise HTTPException(404, "Budget not found.")
    for field, value in budget_in.model_dump(exclude_unset=True).items():
        setattr(db_budget, field, value)
    await db.commit()
    await db.refresh(db_budget)
    return db_budget


@app.post("/api/budgets/{budget_id}/archive", response_model=BudgetResponse, tags=["Budgets & Analytics"])
async def archive_budget(budget_id: uuid.UUID, restore: bool = Query(default=False), db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    db_budget = await db.get(Budget, budget_id)
    if not db_budget:
        raise HTTPException(404, "Budget not found.")
    db_budget.is_active = restore
    await db.commit()
    await db.refresh(db_budget)
    return db_budget


# ---------------- Frontend ----------------
@app.get("/", response_class=HTMLResponse, tags=["Frontend"])
async def serve_frontend():
    file_path = os.path.join("static", "index.html")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h3>Frontend index.html not found in the 'static' folder.</h3>"


# ==================== Lifecycle endpoints (added) ====================

@app.put("/api/documents/{document_id}", response_model=DocumentResponse, tags=["Transactions"])
async def update_document_endpoint(document_id: uuid.UUID, doc_in: DocumentUpdate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        doc = await svc_update_document(db, document_id, doc_in.contact_id, doc_in.date, doc_in.due_date, [l.model_dump() for l in doc_in.lines])
    except Exception:
        await db.rollback()
        raise
    return document_response(doc)


@app.delete("/api/documents/{document_id}", status_code=204, tags=["Transactions"])
async def delete_document_endpoint(document_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        await svc_delete_document(db, document_id)
    except Exception:
        await db.rollback()
        raise
    return None


@app.post("/api/documents/{document_id}/cancel", response_model=DocumentResponse, tags=["Transactions"])
async def cancel_document_endpoint(document_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        doc = await svc_cancel_document(db, document_id)
    except Exception:
        await db.rollback()
        raise
    return document_response(doc)


def _entry_to_response(entry) -> JournalEntryResponse:
    total_debit = sum((item.debit for item in entry.items), Decimal("0.00"))
    total_credit = sum((item.credit for item in entry.items), Decimal("0.00"))
    return JournalEntryResponse(
        id=entry.id, date=entry.date, reference=entry.reference, status=entry.status,
        journal_id=entry.journal_id, journal_name=entry.journal.name if entry.journal else None,
        total_debit=total_debit, total_credit=total_credit, balanced=total_debit == total_credit,
        items=[JournalItemResponse(
            id=i.id, entry_id=i.entry_id, account_id=i.account_id,
            account_code=i.account.code, account_name=i.account.name, account_type=i.account.type,
            analytic_account_id=i.analytic_account_id, debit=i.debit, credit=i.credit,
        ) for i in entry.items],
    )


@app.post("/api/journal-entries/", response_model=JournalEntryResponse, tags=["Accounting"])
async def create_journal_entry_endpoint(entry_in: JournalEntryCreate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        entry = await create_manual_journal_entry(db, entry_in.date, entry_in.reference, entry_in.journal_id, [i.model_dump() for i in entry_in.items])
    except Exception:
        await db.rollback()
        raise
    return _entry_to_response(entry)


@app.put("/api/journal-entries/{entry_id}", response_model=JournalEntryResponse, tags=["Accounting"])
async def update_journal_entry_endpoint(entry_id: uuid.UUID, entry_in: JournalEntryUpdate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        entry = await update_manual_journal_entry(db, entry_id, entry_in.date, entry_in.reference, entry_in.journal_id, [i.model_dump() for i in entry_in.items])
    except Exception:
        await db.rollback()
        raise
    return _entry_to_response(entry)


@app.post("/api/journal-entries/{entry_id}/post", response_model=JournalEntryResponse, tags=["Accounting"])
async def post_journal_entry_endpoint(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        entry = await post_manual_journal_entry(db, entry_id)
    except Exception:
        await db.rollback()
        raise
    return _entry_to_response(entry)


@app.post("/api/journal-entries/{entry_id}/cancel", response_model=JournalEntryResponse, tags=["Accounting"])
async def cancel_journal_entry_endpoint(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        entry = await cancel_manual_journal_entry(db, entry_id)
    except Exception:
        await db.rollback()
        raise
    return _entry_to_response(entry)


@app.put("/api/payments/{payment_id}", response_model=PaymentListResponse, tags=["Transactions"])
async def update_payment_endpoint(payment_id: uuid.UUID, body: PaymentUpdate, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        record = await svc_update_payment(db, payment_id, body.journal_id, body.payment_date, body.amount, body.reference, body.method)
    except Exception:
        await db.rollback()
        raise
    return record


@app.post("/api/payments/{payment_id}/post", response_model=PaymentListResponse, tags=["Transactions"])
async def post_payment_endpoint(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        record = await svc_post_payment(db, payment_id)
    except Exception:
        await db.rollback()
        raise
    return record


@app.post("/api/payments/{payment_id}/cancel", response_model=PaymentListResponse, tags=["Transactions"])
async def cancel_payment_endpoint(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db), _staff: User = Depends(require_staff)):
    try:
        record = await svc_cancel_payment(db, payment_id)
    except Exception:
        await db.rollback()
        raise
    return record
