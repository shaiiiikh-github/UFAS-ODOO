import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Enum, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.domain import Contact


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    ACCOUNTANT = "Accountant"
    CONTACT = "Contact"


class User(Base, TimestampMixin):
    """Login account. Admin/Accountant users manage the system.
    A Contact-role user is linked to exactly one Contact record and can only
    see/act on that contact's own documents.
    """

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
    Enum(
        UserRole,
        name="userrole",
        values_callable=lambda enum_cls: [member.value for member in enum_cls],
    ),
    nullable=False,
)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    contact_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
    )

    contact: Mapped["Contact | None"] = relationship()