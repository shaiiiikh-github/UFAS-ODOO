"""add lifecycle fields: JE/payment status, payment method, doc due_date/source, Cancelled status

Revision ID: e6a1b2c3d4e5
Revises: d5f9a3c7e421
Create Date: 2026-09-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e6a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "d5f9a3c7e421"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend the existing documentstatus enum with 'Cancelled'.
    # ADD VALUE cannot run inside a transaction block, so use an autocommit block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE documentstatus ADD VALUE IF NOT EXISTS 'CANCELLED'")

    # Journal entry lifecycle status (Draft/Posted/Cancelled). Existing rows are Posted.
    op.add_column(
        "journal_entries",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="Posted"),
    )

    # Payment lifecycle status + method; allow a draft payment to exist with no journal entry yet.
    op.add_column(
        "payments",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="Posted"),
    )
    op.add_column("payments", sa.Column("method", sa.String(length=20), nullable=True))
    op.alter_column("payments", "journal_entry_id", existing_type=sa.UUID(), nullable=True)

    # Documents: optional due date and a link back to the source order on convert.
    op.add_column("transaction_documents", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column("transaction_documents", sa.Column("source_document_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_txn_docs_source_document_id",
        "transaction_documents",
        "transaction_documents",
        ["source_document_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_txn_docs_source_document_id", "transaction_documents", type_="foreignkey")
    op.drop_column("transaction_documents", "source_document_id")
    op.drop_column("transaction_documents", "due_date")
    op.alter_column("payments", "journal_entry_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("payments", "method")
    op.drop_column("payments", "status")
    op.drop_column("journal_entries", "status")
    # Note: Postgres cannot easily drop a single enum value; 'Cancelled' is left in documentstatus.
