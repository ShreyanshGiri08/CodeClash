import logging
import uuid
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.models import SignupRequest, LoginRequest, AuthResponse
from app.services.auth_service import hash_password, verify_password, create_token
from app.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("codeclash.auth")


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, conn: asyncpg.Connection = Depends(get_db)):
    """Create a new user account with email + password."""
    try:
        existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", body.email)
        if existing:
            raise HTTPException(400, "Email already registered")

        user_id = str(uuid.uuid4())
        user_uuid = uuid.UUID(user_id)
        hashed = hash_password(body.password)

        await conn.execute(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
            user_uuid, body.email, hashed,
        )

        token = create_token(user_id)

        logger.info("User signed up", extra={"user_id": user_id})
        return {"token": token, "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Signup failed")
        raise HTTPException(400, f"Signup failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, conn: asyncpg.Connection = Depends(get_db)):
    """Login with email + password, returns JWT."""
    try:
        user = await conn.fetchrow(
            "SELECT id, password_hash FROM users WHERE email = $1", body.email
        )
        if not user or not verify_password(body.password, user["password_hash"]):
            raise HTTPException(401, "Invalid credentials")

        user_id = str(user["id"])
        token = create_token(user_id)

        logger.info("User logged in", extra={"user_id": user_id})
        return {"token": token, "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Login failed")
        raise HTTPException(400, f"Login failed: {str(e)}")



