from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal
import uuid
from app.models.domain import ContactType, ProductType, DocumentType, DocumentStatus
from app.models.accounting import AnalyticType

# --- Contacts ---
class ContactCreate(BaseModel):
    name: str
    type: ContactType
    email: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None

class ContactResponse(ContactCreate):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Products ---
class ProductCreate(BaseModel):
    name: str
    type: ProductType
    sales_price: Decimal
    cost: Decimal
    category: Optional[str] = None

class ProductResponse(ProductCreate):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Transactions ---
class DocumentLineCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal

class DocumentCreate(BaseModel):
    contact_id: uuid.UUID
    type: DocumentType
    date: date
    lines: List[DocumentLineCreate]

class DocumentLineResponse(DocumentLineCreate):
    id: uuid.UUID
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    type: DocumentType
    status: DocumentStatus
    date: date
    total: Decimal
    lines: List[DocumentLineResponse]
    model_config = ConfigDict(from_attributes=True)

# --- Reports ---
class BalanceSheetResponse(BaseModel):
    assets: Decimal
    liabilities: Decimal
    equity: Decimal
    net_profit: Decimal
    total_liabilities_and_equity: Decimal

class PnLResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_profit: Decimal
    
class PaymentCreate(BaseModel):
    document_id: uuid.UUID
    amount: Decimal
    payment_method: str  # e.g., "Bank" or "Cash"

class PaymentResponse(BaseModel):
    message: str
    document_status: DocumentStatus

# --- Analytics ---
class AnalyticAccountCreate(BaseModel):
    name: str
    type: AnalyticType

class AnalyticAccountResponse(AnalyticAccountCreate):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Budgets ---
class BudgetCreate(BaseModel):
    name: str
    analytic_account_id: uuid.UUID
    planned_amount: Decimal
    start_date: date
    end_date: date

class BudgetResponse(BudgetCreate):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)