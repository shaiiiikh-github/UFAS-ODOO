"""add users table, contact profile image, and is_active archiving to master data

Revision ID: c48a9e2f1d33
Revises: b31d6f2c9a11
Create Date: 2026-09-05
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c48a9e2f1d33"
down_revision: Union[str, Sequence[str], None] = "b31d6f2c9a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USER_ROLE_ENUM = sa.Enum("Admin", "Accountant", "Contact", name="userrole")

ARCHIVABLE_TABLES = [
    "contacts",
    "products",
    "chart_of_accounts",
    "journals",
    "analytic_accounts",
    "budgets",
]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", USER_ROLE_ENUM, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("contact_id", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("contact_id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.add_column("contacts", sa.Column("profile_image_url", sa.String(length=255), nullable=True))

    for table in ARCHIVABLE_TABLES:
        op.add_column(table, sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    for table in ARCHIVABLE_TABLES:
        op.drop_column(table, "is_active")

    op.drop_column("contacts", "profile_image_url")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

    USER_ROLE_ENUM.drop(op.get_bind(), checkfirst=True)
