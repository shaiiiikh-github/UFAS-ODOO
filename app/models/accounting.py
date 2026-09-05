import enum
import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String, Date, Enum, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, ArchivableMixin


class AccountType(str, enum.Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    INCOME = "Income"
    EXPENSE = "Expense"


class AnalyticType(str, enum.Enum):
    INCOME = "Income"
    EXPENSE = "Expense"


class Account(Base, TimestampMixin, ArchivableMixin):
    __tablename__ = "chart_of_accounts"

    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[AccountType] = mapped_column(Enum(AccountType))


class Journal(Base, TimestampMixin, ArchivableMixin):
    __tablename__ = "journals"

    name: Mapped[str] = mapped_column(String(50), index=True)
    type: Mapped[str] = mapped_column(String(20))
    default_account_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("chart_of_accounts.id"), nullable=True
    )

    default_account: Mapped["Account | None"] = relationship()


class AnalyticAccount(Base, TimestampMixin, ArchivableMixin):
    __tablename__ = "analytic_accounts"

    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[AnalyticType] = mapped_column(Enum(AnalyticType))


class Budget(Base, TimestampMixin, ArchivableMixin):
    __tablename__ = "budgets"

    name: Mapped[str] = mapped_column(String(100))
    period_start: Mapped[Date] = mapped_column(Date)
    period_end: Mapped[Date] = mapped_column(Date)
    responsible_person: Mapped[str] = mapped_column(String(100))
    planned_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    analytic_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("analytic_accounts.id")
    )

    analytic_account: Mapped["AnalyticAccount"] = relationship()


class JournalEntry(Base, TimestampMixin):
    __tablename__ = "journal_entries"

    date: Mapped[Date] = mapped_column(Date)
    reference: Mapped[str] = mapped_column(String(100), index=True)
    journal_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("journals.id"), nullable=True
    )

    journal: Mapped["Journal | None"] = relationship()
    items: Mapped[list["JournalItem"]] = relationship(
        back_populates="entry", cascade="all, delete-orphan"
    )


class JournalItem(Base, TimestampMixin):
    __tablename__ = "journal_items"

    entry_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chart_of_accounts.id"), index=True
    )
    analytic_account_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("analytic_accounts.id"), nullable=True
    )
    debit: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0.00"), nullable=False
    )
    credit: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0.00"), nullable=False
    )

    entry: Mapped["JournalEntry"] = relationship(back_populates="items")
    account: Mapped["Account"] = relationship()
    analytic_account: Mapped["AnalyticAccount | None"] = relationship()


class Payment(Base, TimestampMixin):
    """Immutable business record for a payment linked to a bill/invoice and journal entry."""

    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_document_id", "document_id"),
        Index("ix_payments_journal_entry_id", "journal_entry_id"),
        UniqueConstraint("journal_entry_id", name="uq_payments_journal_entry_id"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transaction_documents.id", ondelete="RESTRICT"), nullable=False
    )
    journal_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("journals.id", ondelete="RESTRICT"), nullable=False
    )
    journal_entry_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("journal_entries.id", ondelete="RESTRICT"), nullable=False
    )
    payment_date: Mapped[Date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    reference: Mapped[str] = mapped_column(String(100), nullable=False)

    document: Mapped["TransactionDocument"] = relationship(foreign_keys=[document_id])
    journal: Mapped["Journal"] = relationship(foreign_keys=[journal_id])
    journal_entry: Mapped["JournalEntry"] = relationship(foreign_keys=[journal_entry_id])
