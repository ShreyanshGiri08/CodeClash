import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.models import CreateChallengeRequest
from app.services.cf_service import get_random_problem
from app.services.race_service import create_race
from app.dependencies import get_current_user, get_db

router = APIRouter(prefix="/challenges", tags=["challenges"])
logger = logging.getLogger("codeclash.challenges")


def is_expired(expires_at: datetime | None) -> bool:
    """Safely check if datetime is expired regardless of tzinfo."""
    if not expires_at:
        return False
    if expires_at.tzinfo is None:
        return datetime.utcnow() > expires_at
    return datetime.now(timezone.utc) > expires_at


@router.post("/create")
async def create_challenge(
    body: CreateChallengeRequest,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Create a private challenge with a shareable link & 6-character room code.
    """
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    user = await conn.fetchrow("SELECT cf_handle, cf_verified, elo FROM users WHERE id = $1", uid)
    if not user or not user["cf_verified"]:
        raise HTTPException(400, "Verify your Codeforces handle first")

    # Generate a clean 6-character uppercase room code e.g. "8F2K4B"
    token = secrets.token_hex(3).upper()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    await conn.execute(
        """INSERT INTO challenges (token, creator_id, problem_rating, expires_at)
           VALUES ($1, $2, $3, $4)""",
        token, uid, body.problem_rating, expires_at,
    )

    logger.info("Challenge created", extra={"user_id": user_id, "token": token})
    return {
        "token": token,
        "room_code": token,
        "share_url": f"/challenge/{token}",
        "status": "pending",
        "problem_rating": body.problem_rating,
    }


@router.get("/{token}")
async def get_challenge(
    token: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get challenge info for the join page by code or token."""
    try:
        clean_token = token.strip()
        upper_token = clean_token.upper()

        challenge = await conn.fetchrow(
            """SELECT c.*, u.cf_handle, u.elo,
                      COALESCE(u.avatar, 'avatar1') as avatar,
                      u.display_name
               FROM challenges c
               JOIN users u ON c.creator_id = u.id
               WHERE c.token = $1 OR UPPER(c.token) = $2""",
            clean_token, upper_token,
        )

        if not challenge:
            raise HTTPException(404, f"Challenge code '{token}' not found")

        if challenge["status"] != "pending":
            return {
                "token": challenge["token"],
                "status": challenge["status"],
                "race_id": str(challenge["race_id"]) if challenge["race_id"] else None,
                "creator_id": str(challenge["creator_id"]),
                "creator_handle": challenge["cf_handle"],
                "creator_elo": challenge["elo"],
                "creator_avatar": challenge["avatar"],
                "creator_name": challenge["display_name"] or challenge["cf_handle"],
                "problem_rating": challenge["problem_rating"],
            }


        # Check expiry safely
        if is_expired(challenge["expires_at"]):
            await conn.execute("UPDATE challenges SET status = 'expired' WHERE id = $1", challenge["id"])
            raise HTTPException(410, "Challenge code has expired")

        return {
            "token": challenge["token"],
            "status": "pending",
            "creator_id": str(challenge["creator_id"]),
            "creator_handle": challenge["cf_handle"],
            "creator_elo": challenge["elo"],
            "creator_avatar": challenge["avatar"],
            "creator_name": challenge["display_name"] or challenge["cf_handle"],
            "problem_rating": challenge["problem_rating"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"get_challenge failed for token {token}")
        raise HTTPException(500, f"Error loading challenge: {str(e)}")


@router.post("/{token}/join")
async def join_challenge(
    token: str,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Join a friend's challenge using room code or token.
    """
    try:
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        joiner = await conn.fetchrow("SELECT cf_handle, cf_verified FROM users WHERE id = $1", uid)
        if not joiner or not joiner["cf_verified"]:
            raise HTTPException(400, "Verify your Codeforces handle first")

        clean_token = token.strip()
        upper_token = clean_token.upper()

        challenge = await conn.fetchrow(
            "SELECT * FROM challenges WHERE token = $1 OR UPPER(token) = $2",
            clean_token, upper_token,
        )
        if not challenge:
            raise HTTPException(404, f"Challenge code '{token}' not found")
        if challenge["status"] != "pending":
            raise HTTPException(400, "Challenge already used or expired")
        if str(challenge["creator_id"]) == user_id:
            raise HTTPException(400, "You can't join your own challenge")

        # Pick a problem at the specified rating
        problem = await get_random_problem(challenge["problem_rating"])
        problem_id = f"{problem['contestId']}{problem['index']}"

        # Create the race
        race = await create_race(
            conn,
            str(challenge["creator_id"]),
            user_id,
            problem_id,
            problem.get("rating"),
            "challenge",
        )
        race_id = str(race["id"])
        race_uid = uuid.UUID(race_id)

        # Update challenge status
        await conn.execute(
            "UPDATE challenges SET status = 'active', race_id = $1 WHERE id = $2",
            race_uid, challenge["id"],
        )

        logger.info("Challenge joined", extra={
            "token": challenge["token"],
            "joiner": user_id,
            "race_id": race_id,
        })

        return {
            "status": "joined",
            "race_id": race_id,
            "problem_id": problem_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"join_challenge failed for token {token}")
        raise HTTPException(500, f"Error joining challenge: {str(e)}")




