"""
Authentication service — password hashing and JWT management.

Uses bcrypt for password hashing (industry standard, configurable work factor).
Uses python-jose for JWT encoding/decoding with HS256.
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import get_settings


def hash_password(password: str) -> str:
    """
    Hash a plaintext password with bcrypt.
    bcrypt automatically generates a unique salt per hash.
    Truncates password bytes at 72 (bcrypt limit).
    """
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Compare a plaintext password against a bcrypt hash."""
    try:
        pwd_bytes = plain.encode("utf-8")
        if len(pwd_bytes) > 72:
            pwd_bytes = pwd_bytes[:72]
        return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))
    except Exception:
        return False



def create_token(user_id: str) -> str:
    """
    Create a JWT with the user_id as the subject claim.
    Token expires after JWT_EXPIRY_DAYS (default 7 days).
    """
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRY_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> str:
    """
    Decode and validate a JWT. Returns the user_id (sub claim).
    Raises JWTError if the token is invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise JWTError("Missing subject claim")
        return user_id
    except JWTError:
        raise
