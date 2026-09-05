import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class ArchivableMixin:
    """For master data records the Admin can modify or archive (soft delete).
    Archived records are hidden from normal listings but never physically deleted,
    so they stay valid for historical transactions/reports that reference them."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)