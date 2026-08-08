"""
FastAPI dependencies — reusable injections for routes.

get_current_user: extracts and validates the JWT from the Authorization header.
get_db: provides an asyncpg connection from the pool (auto-released after request).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import decode_token
from app.database import get_pool
import asyncpg

security = HTTPBearer()


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract user_id from JWT bearer token.
    Returns the user_id string (UUID as string).
    Raises 401 if token is invalid or expired.
    """
    try:
        user_id = decode_token(creds.credentials)
        return user_id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


from app.database import get_or_create_pool

async def get_db() -> asyncpg.Connection:
    """
    Acquire a connection from the asyncpg pool.
    The connection is automatically returned to the pool
    when the request handler finishes.
    """
    pool = await get_or_create_pool()
    async with pool.acquire() as conn:
        yield conn

