from datetime import date
from decimal import Decimal
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.accounting import AccountType, AnalyticType
from app.models.domain import ContactType, ProductType, DocumentType, DocumentStatus
from app.models.auth import UserRole


# ---------------- Auth ----------------
class UserCreate(BaseModel):
    """Admin-only: create another Admin or Accountant (Invoicing User) login."""
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.ACCOUNTANT

    @field_validator("role")
    @classmethod
    def staff_role_only(cls, value: UserRole) -> UserRole:
        if value == UserRole.CONTACT:
            raise ValueError("Contact portal logins are created from the Contact record, not here.")
        return value


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    contact_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------- Contacts ----------------
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: ContactType
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    # Optional: also provision a portal login for this contact (email + password required if set).
    create_portal_user: bool = False
    portal_password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class ContactUpdate(BaseModel):
    """Admin-only edit. All fields optional; only supplied fields are changed."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[ContactType] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: ContactType
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# ---------------- Products ----------------
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: ProductType
    sales_price: Decimal = Field(ge=0)
    cost: Decimal = Field(ge=0)
    category: Optional[str] = None
    stock_quantity: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    """Admin-only edit. All fields optional; only supplied fields are changed."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[ProductType] = None
    sales_price: Optional[Decimal] = Field(default=None, ge=0)
    cost: Optional[Decimal] = Field(default=None, ge=0)
    category: Optional[str] = None
    stock_quantity: Optional[int] = Field(default=None, ge=0)


class ProductResponse(ProductCreate):
    id: uuid.UUID
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class StockReportRow(BaseModel):
    id: uuid.UUID
    name: str
    type: ProductType
    category: Optional[str] = None
    stock_quantity: int
    cost: Decimal
    sales_price: Decimal
    stock_value_at_cost: Decimal
    is_active: bool


class DocumentLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    analytic_account_id: Optional[uuid.UUID] = None


class DocumentCreate(BaseModel):
    contact_id: uuid.UUID
    type: DocumentType
    date: date
    due_date: Optional[date] = None
    lines: List[DocumentLineCreate] = Field(min_length=1)


class DocumentUpdate(BaseModel):
    """Edit a DRAFT document: header + full line replacement."""
    contact_id: uuid.UUID
    date: date
    due_date: Optional[date] = None
    lines: List[DocumentLineCreate] = Field(min_length=1)


class DocumentLineResponse(DocumentLineCreate):
    id: uuid.UUID
    subtotal: Decimal
    product_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    contact_name: Optional[str] = None
    type: DocumentType
    status: DocumentStatus
    date: date
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    outstanding_amount: Decimal = Decimal("0.00")
    due_date: Optional[date] = None
    source_document_id: Optional[uuid.UUID] = None
    journal_entry_id: Optional[uuid.UUID] = None
    lines: List[DocumentLineResponse]
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_document(cls, doc):
        data = cls.model_validate(doc)
        data.outstanding_amount = max(Decimal("0.00"), doc.total - doc.amount_paid)
        data.contact_name = doc.contact.name if getattr(doc, "contact", None) is not None else None
        data.lines = [
            DocumentLineResponse(
                **DocumentLineResponse.model_validate(line).model_dump(exclude={"product_name"}),
                product_name=line.product.name if getattr(line, "product", None) is not None else None,
            )
            for line in doc.lines
        ]
        return data


class BalanceSheetResponse(BaseModel):
    assets: Decimal
    liabilities: Decimal
    equity: Decimal
    net_profit: Decimal
    total_liabilities_and_equity: Decimal
    balanced: bool


class PnLResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_profit: Decimal


class AccountCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=100)
    type: AccountType


class AccountUpdate(BaseModel):
    """Admin-only edit. Account code is immutable once created (it's referenced by postings)."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[AccountType] = None


class AccountResponse(AccountCreate):
    id: uuid.UUID
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class AccountBalanceResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    type: AccountType
    debit: Decimal
    credit: Decimal
    balance: Decimal


class JournalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    type: str = Field(min_length=1, max_length=20)
    default_account_id: Optional[uuid.UUID] = None


class JournalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    type: Optional[str] = Field(default=None, min_length=1, max_length=20)
    default_account_id: Optional[uuid.UUID] = None


class JournalResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    default_account_id: Optional[uuid.UUID] = None
    default_account_name: Optional[str] = None
    is_active: bool = True


class PaymentCreate(BaseModel):
    document_id: uuid.UUID
    journal_id: uuid.UUID
    payment_date: date
    amount: Decimal = Field(gt=0)
    reference: Optional[str] = Field(default=None, max_length=100)
    method: Optional[str] = Field(default=None, max_length=20)


class PaymentUpdate(BaseModel):
    journal_id: uuid.UUID
    payment_date: date
    amount: Decimal = Field(gt=0)
    reference: Optional[str] = Field(default=None, max_length=100)
    method: Optional[str] = Field(default=None, max_length=20)


class PaymentResponse(BaseModel):
    message: str
    payment_id: uuid.UUID
    document_id: uuid.UUID
    document_status: DocumentStatus
    payment_amount: Decimal
    total_paid: Decimal
    outstanding_amount: Decimal
    journal_entry_id: uuid.UUID


class PaymentListResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    journal_id: uuid.UUID
    payment_date: date
    amount: Decimal
    reference: str
    provider: str = "manual"
    status: str = "Posted"
    method: Optional[str] = None
    journal_entry_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)


# ---------------- Razorpay ----------------
class RazorpayOrderCreate(BaseModel):
    document_id: uuid.UUID


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int  # paise, as returned by Razorpay
    currency: str
    key_id: str  # public key — safe to expose to the frontend


class RazorpayVerifyRequest(BaseModel):
    document_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class AnalyticAccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: AnalyticType


class AnalyticAccountUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[AnalyticType] = None


class AnalyticAccountResponse(AnalyticAccountCreate):
    id: uuid.UUID
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class BudgetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    analytic_account_id: uuid.UUID
    planned_amount: Decimal = Field(ge=0)
    period_start: date
    period_end: date
    responsible_person: str = Field(min_length=1, max_length=100)

    @field_validator("period_end")
    @classmethod
    def validate_period(cls, value, info):
        start = info.data.get("period_start")
        if start and value < start:
            raise ValueError("period_end cannot be earlier than period_start")
        return value


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    analytic_account_id: Optional[uuid.UUID] = None
    planned_amount: Optional[Decimal] = Field(default=None, ge=0)
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    responsible_person: Optional[str] = Field(default=None, min_length=1, max_length=100)


class BudgetResponse(BudgetCreate):
    id: uuid.UUID
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class BudgetReportRow(BaseModel):
    id: uuid.UUID
    name: str
    analytic_account_id: uuid.UUID
    analytic_account_name: Optional[str]
    period_start: date
    period_end: date
    responsible_person: str
    planned: Decimal
    actual: Decimal
    variance: Decimal
    utilization_percent: Decimal


class JournalItemResponse(BaseModel):
    id: uuid.UUID
    entry_id: uuid.UUID
    account_id: uuid.UUID
    account_code: str
    account_name: str
    account_type: AccountType
    analytic_account_id: Optional[uuid.UUID]
    debit: Decimal
    credit: Decimal


class JournalItemCreate(BaseModel):
    account_id: uuid.UUID
    analytic_account_id: Optional[uuid.UUID] = None
    debit: Decimal = Field(default=Decimal("0.00"), ge=0)
    credit: Decimal = Field(default=Decimal("0.00"), ge=0)


class JournalEntryCreate(BaseModel):
    date: date
    reference: Optional[str] = Field(default=None, max_length=100)
    journal_id: Optional[uuid.UUID] = None
    items: List[JournalItemCreate] = Field(min_length=1)


class JournalEntryUpdate(JournalEntryCreate):
    pass


class JournalEntryResponse(BaseModel):
    id: uuid.UUID
    date: date
    reference: str
    status: str = "Posted"
    journal_id: Optional[uuid.UUID]
    journal_name: Optional[str]
    total_debit: Decimal
    total_credit: Decimal
    balanced: bool
    items: List[JournalItemResponse]