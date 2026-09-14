from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_db
from .security import decode_access_token, decode_supabase_token
from ..models.user import User

bearer = HTTPBearer(auto_error=False)


async def _resolve_token(
    credentials: HTTPAuthorizationCredentials,
    db: AsyncSession,
) -> User:
    token = credentials.credentials

    # Try our own JWT first, then Supabase JWT
    payload = decode_access_token(token) or decode_supabase_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id: str = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return await _resolve_token(credentials, db)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return await _resolve_token(credentials, db)
    except HTTPException:
        return None


async def require_instructor(user: User = Depends(get_current_user)) -> User:
    if user.role != "instructor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Instructor access required")
    return user
