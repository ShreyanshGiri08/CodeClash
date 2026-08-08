"""
Leaderboard route — ranked list of all users by Elo.
"""

import logging
from fastapi import APIRouter, Depends, Query
import asyncpg
from app.dependencies import get_db

router = APIRouter(tags=["leaderboard"])
logger = logging.getLogger("codeclash.leaderboard")


from typing import Optional

@router.get("/leaderboard")
async def get_leaderboard(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    min_elo: Optional[int] = Query(None),
    max_elo: Optional[int] = Query(None),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Get the ranked leaderboard, paginated with search filtering & has_more cursor flag.
    Only includes users who have played at least 1 race (or all registered users if search is active).
    """
    offset = (page - 1) * limit

    conditions = ["1=1"]
    params = []
    p_idx = 1

    if search and search.strip():
        conditions.append(f"(cf_handle ILIKE ${p_idx} OR display_name ILIKE ${p_idx})")
        params.append(f"%{search.strip()}%")
        p_idx += 1
    # Include all registered users on the ladder
    pass


    if min_elo is not None:
        conditions.append(f"elo >= ${p_idx}")
        params.append(min_elo)
        p_idx += 1

    if max_elo is not None:
        conditions.append(f"elo <= ${p_idx}")
        params.append(max_elo)
        p_idx += 1

    where_clause = " WHERE " + " AND ".join(conditions)

    count_query = f"SELECT COUNT(*) FROM users{where_clause}"
    total = await conn.fetchval(count_query, *params)

    query = f"""
        SELECT id, cf_handle, display_name, elo, races_played, races_won, avatar
        FROM users
        {where_clause}
        ORDER BY elo DESC, races_won DESC, races_played ASC
        LIMIT ${p_idx} OFFSET ${p_idx + 1}
    """
    params.extend([limit, offset])

    rows = await conn.fetch(query, *params)

    entries = [
        {
            "rank": offset + i + 1,
            "id": str(r["id"]),
            "cf_handle": r["cf_handle"],
            "display_name": r["display_name"],
            "elo": r["elo"],
            "races_played": r["races_played"],
            "races_won": r["races_won"],
            "avatar": r["avatar"],
        }
        for i, r in enumerate(rows)
    ]

    has_more = (offset + len(entries)) < total

    return {
        "entries": entries,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total else 1,
        "has_more": has_more,
    }

