import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.auth import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise unauthorized
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise unauthorized
    return user


def require_roles(*roles: UserRole):
    """Dependency factory: only lets the listed roles through."""

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to perform this action.",
            )
        return current_user

    return _checker


# Admin (Business Owner): create/modify/archive master data, record transactions, view reports.
require_admin = require_roles(UserRole.ADMIN)

# Admin + Accountant (Invoicing User): both can create master data, record transactions, view reports.
require_staff = require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT)

# Any authenticated user (Admin, Accountant, or Contact).
require_any = require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CONTACT)
