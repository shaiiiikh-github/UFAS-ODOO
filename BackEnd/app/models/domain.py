import enum
import uuid
from decimal import Decimal
from datetime import date
from sqlalchemy import String, Enum, Numeric, ForeignKey, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, ArchivableMixin
from typing import Optional
import time


class ContactType(str, enum.Enum):
    CUSTOMER = "Customer"
    VENDOR = "Vendor"
    BOTH = "Both"

class Contact(Base, TimestampMixin, ArchivableMixin):
    """Contact Master Data"""
    __tablename__ = "contacts"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    type: Mapped[ContactType] = mapped_column(Enum(ContactType), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    mobile: Mapped[str] = mapped_column(String(20), nullable=True)
    city: Mapped[str] = mapped_column(String(50), nullable=True)
    state: Mapped[str] = mapped_column(String(50), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    profile_image_url: Mapped[str] = mapped_column(String(255), nullable=True)

class ProductType(str, enum.Enum):
    GOODS = "Goods"
    SERVICE = "Service"
    COMBO = "Combo"

class Product(Base, TimestampMixin, ArchivableMixin):
    """Product Master Data"""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    type: Mapped[ProductType] = mapped_column(Enum(ProductType), nullable=False)
    sales_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    category: Mapped[str] = mapped_column(String(50), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

class DocumentType(str, enum.Enum):
    PURCHASE_ORDER = "Purchase Order"
    VENDOR_BILL = "Vendor Bill"
    SALES_ORDER = "Sales Order"
    CUSTOMER_INVOICE = "Customer Invoice"

class DocumentStatus(str, enum.Enum):
    DRAFT = "Draft"
    CONFIRMED = "Confirmed"
    PARTIALLY_PAID = "Partially Paid"
    PAID = "Paid"
    CANCELLED = "Cancelled"

class TransactionDocument(Base, TimestampMixin):
    """Handles SO, PO, Bills, and Invoices"""
    __tablename__ = "transaction_documents"

    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.DRAFT)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("transaction_documents.id"), nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    total: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    
    # Link to the generated journal entry once confirmed
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("journal_entries.id"), nullable=True)

    lines: Mapped[list["DocumentLine"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    contact: Mapped["Contact"] = relationship()

class DocumentLine(Base, TimestampMixin):
    """Line items for transactions"""
    __tablename__ = "document_lines"

    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transaction_documents.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    analytic_account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("analytic_accounts.id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    document: Mapped["TransactionDocument"] = relationship(back_populates="lines")
    product: Mapped["Product"] = relationship()