"""add razorpay fields to payments

Revision ID: d5f9a3c7e421
Revises: c48a9e2f1d33
Create Date: 2026-09-05
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d5f9a3c7e421"
down_revision: Union[str, Sequence[str], None] = "c48a9e2f1d33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="manual"),
    )
    op.add_column(
        "payments",
        sa.Column("razorpay_order_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "payments",
        sa.Column("razorpay_payment_id", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_payments_razorpay_order_id", "payments", ["razorpay_order_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_payments_razorpay_order_id", "payments", type_="unique")
    op.drop_column("payments", "razorpay_payment_id")
    op.drop_column("payments", "razorpay_order_id")
    op.drop_column("payments", "provider")