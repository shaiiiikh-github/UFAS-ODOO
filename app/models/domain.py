import enum
import uuid
from decimal import Decimal
from datetime import date
from sqlalchemy import String, Enum, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class ContactType(str, enum.Enum):
    CUSTOMER = "Customer"
    VENDOR = "Vendor"
    BOTH = "Both"

class Contact(Base, TimestampMixin):
    """Contact Master Data"""
    __tablename__ = "contacts"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    type: Mapped[ContactType] = mapped_column(Enum(ContactType), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    mobile: Mapped[str] = mapped_column(String(20), nullable=True)
    city: Mapped[str] = mapped_column(String(50), nullable=True)

class ProductType(str, enum.Enum):
    GOODS = "Goods"
    SERVICE = "Service"
    COMBO = "Combo"

class Product(Base, TimestampMixin):
    """Product Master Data"""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    type: Mapped[ProductType] = mapped_column(Enum(ProductType), nullable=False)
    sales_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    category: Mapped[str] = mapped_column(String(50), nullable=True)

class DocumentType(str, enum.Enum):
    PURCHASE_ORDER = "Purchase Order"
    VENDOR_BILL = "Vendor Bill"
    SALES_ORDER = "Sales Order"
    CUSTOMER_INVOICE = "Customer Invoice"

class DocumentStatus(str, enum.Enum):
    DRAFT = "Draft"
    CONFIRMED = "Confirmed"
    PAID = "Paid"

class TransactionDocument(Base, TimestampMixin):
    """Handles SO, PO, Bills, and Invoices"""
    __tablename__ = "transaction_documents"

    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.DRAFT)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    
    # Link to the generated journal entry once confirmed
    journal_entry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("journal_entries.id"), nullable=True)

    lines: Mapped[list["DocumentLine"]] = relationship(back_populates="document", cascade="all, delete-orphan")

class DocumentLine(Base, TimestampMixin):
    """Line items for transactions"""
    __tablename__ = "document_lines"

    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transaction_documents.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    document: Mapped["TransactionDocument"] = relationship(back_populates="lines")