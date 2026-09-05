import enum
import uuid
from decimal import Decimal
from sqlalchemy import String, Enum, Numeric, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class AccountType(str, enum.Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    INCOME = "Income"
    EXPENSE = "Expense"

class Account(Base, TimestampMixin):
    """Chart of Accounts Master Data"""
    __tablename__ = "chart_of_accounts"

    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[AccountType] = mapped_column(Enum(AccountType))

class JournalEntry(Base, TimestampMixin):
    """Records the transaction header"""
    __tablename__ = "journal_entries"

    date: Mapped[Date] = mapped_column(Date)
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    narration: Mapped[str] = mapped_column(Text, nullable=True)

class JournalItem(Base, TimestampMixin):
    """Records the double-entry debits and credits"""
    __tablename__ = "journal_items"

    entry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("journal_entries.id"))
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chart_of_accounts.id"))
    debit: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    credit: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))