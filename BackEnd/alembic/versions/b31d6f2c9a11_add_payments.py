"""add payments and accounting integrity indexes

Revision ID: b31d6f2c9a11
Revises: a67f1684f89f
Create Date: 2026-09-05
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b31d6f2c9a11"
down_revision: Union[str, Sequence[str], None] = "a67f1684f89f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("journal_id", sa.UUID(), nullable=False),
        sa.Column("journal_entry_id", sa.UUID(), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("reference", sa.String(length=100), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["transaction_documents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["journal_id"], ["journals.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["journal_entry_id"], ["journal_entries.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("journal_entry_id", name="uq_payments_journal_entry_id"),
    )
    op.create_index(op.f("ix_payments_id"), "payments", ["id"], unique=False)
    op.create_index(op.f("ix_payments_document_id"), "payments", ["document_id"], unique=False)
    op.create_index(op.f("ix_payments_journal_entry_id"), "payments", ["journal_entry_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_journal_entry_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_document_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_id"), table_name="payments")
    op.drop_table("payments")
