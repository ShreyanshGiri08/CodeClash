import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.models import UserProfile, UpdateProfileRequest
from app.dependencies import get_current_user, get_db

router = APIRouter(tags=["users"])
logger = logging.getLogger("codeclash.users")

# Valid avatar options
VALID_AVATARS = [
    "avatar1", "avatar2", "avatar3", "avatar4",
    "avatar5", "avatar6", "avatar7", "avatar8",
    "avatar9", "avatar10", "avatar11", "avatar12",
]


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get the currently authenticated user's profile."""
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    user = await conn.fetchrow(
        """SELECT id, email, cf_handle, cf_verified, elo, races_played,
                  races_won, avatar, display_name
           FROM users WHERE id = $1""",
        uid,
    )
    if not user:
        raise HTTPException(404, "User not found")

    cf_handle = user["cf_handle"]
    cf_verified = bool(user["cf_verified"]) if user["cf_verified"] is not None else False
    if cf_handle and len(cf_handle.strip()) > 0:
        cf_verified = True

    return {
        "id": str(user["id"]),
        "email": user["email"],
        "cf_handle": cf_handle,
        "cf_verified": cf_verified,
        "elo": user["elo"] if user["elo"] is not None else 1200,
        "races_played": user["races_played"] if user["races_played"] is not None else 0,
        "races_won": user["races_won"] if user["races_won"] is not None else 0,
        "avatar": user["avatar"] or "avatar1",
        "display_name": user["display_name"],
    }



@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Update display name and/or avatar."""
    if body.avatar and body.avatar not in VALID_AVATARS:
        raise HTTPException(400, f"Invalid avatar. Choose from: {VALID_AVATARS}")

    updates = []
    params = []
    param_idx = 1

    if body.display_name is not None:
        param_idx += 1
        updates.append(f"display_name = ${param_idx}")
        params.append(body.display_name)

    if body.avatar is not None:
        param_idx += 1
        updates.append(f"avatar = ${param_idx}")
        params.append(body.avatar)

    if not updates:
        raise HTTPException(400, "No fields to update")

    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    query = f"UPDATE users SET {', '.join(updates)} WHERE id = $1"
    await conn.execute(query, uid, *params)

    logger.info("Profile updated", extra={"user_id": user_id})
    return {"status": "updated"}


@router.get("/users/{target_user_id}/rating-history")
async def get_rating_history(
    target_user_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get a user's Elo rating history for the graph."""
    uid = uuid.UUID(target_user_id) if isinstance(target_user_id, str) else target_user_id
    rows = await conn.fetch(
        """SELECT elo_after, elo_change, recorded_at, race_id
           FROM rating_history
           WHERE user_id = $1
           ORDER BY recorded_at ASC""",
        uid,
    )
    return [
        {
            "elo_after": r["elo_after"],
            "elo_change": r["elo_change"],
            "recorded_at": r["recorded_at"].isoformat(),
            "race_id": str(r["race_id"]) if r["race_id"] else None,
        }
        for r in rows
    ]


@router.get("/races/history")
async def get_race_history(
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get the current user's past races."""
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    rows = await conn.fetch(
        """SELECT r.id, r.problem_id, r.status, r.winner_id, r.started_at, r.ended_at,
                  r.race_type, r.p1_elo_before, r.p2_elo_before, r.p1_elo_after, r.p2_elo_after,
                  r.player1_id, r.player2_id,
                  u1.cf_handle as p1_handle, u2.cf_handle as p2_handle
           FROM races r
           LEFT JOIN users u1 ON r.player1_id = u1.id
           LEFT JOIN users u2 ON r.player2_id = u2.id
           WHERE r.player1_id = $1 OR r.player2_id = $1
           ORDER BY r.started_at DESC
           LIMIT 20""",
        uid,
    )

    races = []
    for r in rows:
        is_p1 = str(r["player1_id"]) == user_id
        opponent_handle = r["p2_handle"] if is_p1 else r["p1_handle"]
        my_elo_before = r["p1_elo_before"] if is_p1 else r["p2_elo_before"]
        my_elo_after = r["p1_elo_after"] if is_p1 else r["p2_elo_after"]
        elo_change = (my_elo_after - my_elo_before) if (my_elo_after and my_elo_before) else None
        won = str(r["winner_id"]) == user_id if r["winner_id"] else False

        races.append({
            "id": str(r["id"]),
            "problem_id": r["problem_id"],
            "opponent_handle": opponent_handle,
            "result": "win" if won else ("loss" if r["winner_id"] else "draw"),
            "elo_change": elo_change,
            "started_at": r["started_at"].isoformat() if r["started_at"] else None,
            "race_type": r["race_type"],
        })

    return races


