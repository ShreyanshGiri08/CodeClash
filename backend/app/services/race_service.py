"""
Race service — handles race lifecycle including IDEMPOTENT finalization.

IDEMPOTENCY EXPLAINED:
  The race finalization (checking verdicts, applying Elo changes) can be
  triggered by multiple sources simultaneously:
    - Player 1 clicks "I submitted, check now"
    - Player 2 clicks the same button at the same time
    - A background polling timer fires

  Without idempotency, two concurrent calls could both detect a winner and
  DOUBLE-APPLY the Elo change (+24 instead of +12). This corrupts ratings.

  Our protection is two-fold:
    1. CHECK-BEFORE-WRITE: First check if race.status == 'finished'.
       If it is, return the existing result without modifying anything.
    2. ATOMIC FLAG: We use an elo_applied BOOLEAN column. The UPDATE
       statement uses a WHERE clause: `WHERE id = $1 AND elo_applied = FALSE`.
       Only one concurrent transaction can succeed — the others get 0 rows
       affected and skip the Elo update.

  For production, you'd additionally use SELECT ... FOR UPDATE (row-level
  locking) within an explicit transaction to make this fully serializable.
"""

import uuid
import logging
from datetime import datetime, timezone
from app.services.elo_service import calculate_elo
from app.services.cf_service import check_verdict, get_ac_timestamp, get_all_submissions_verdicts

logger = logging.getLogger("codeclash.race")


async def create_race(
    conn,
    player1_id: str,
    player2_id: str,
    problem_id: str,
    problem_rating: int | None = None,
    race_type: str = "ranked",
) -> dict:
    """Create a new race record in the database."""
    p1_uid = uuid.UUID(player1_id) if isinstance(player1_id, str) else player1_id
    p2_uid = uuid.UUID(player2_id) if isinstance(player2_id, str) else player2_id

    p1 = await conn.fetchrow("SELECT elo FROM users WHERE id = $1", p1_uid)
    p2 = await conn.fetchrow("SELECT elo FROM users WHERE id = $1", p2_uid)

    race = await conn.fetchrow(
        """
        INSERT INTO races (player1_id, player2_id, problem_id, problem_rating,
                          status, race_type, p1_elo_before, p2_elo_before)
        VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
        RETURNING id, player1_id, player2_id, problem_id, status, started_at
        """,
        p1_uid, p2_uid, problem_id, problem_rating,
        race_type, p1["elo"] if p1 else 1200, p2["elo"] if p2 else 1200,
    )
    logger.info("Race created", extra={"race_id": str(race["id"]), "problem": problem_id})
    return dict(race)


async def get_race_details(conn, race_id: str) -> dict | None:
    """
    Fetch race details with player handles, avatars, and Elo info.
    """
    rid = uuid.UUID(race_id) if isinstance(race_id, str) else race_id
    race = await conn.fetchrow("SELECT * FROM races WHERE id = $1", rid)
    if not race:
        return None

    race = dict(race)

    # Enrich with player info
    p1 = await conn.fetchrow(
        "SELECT cf_handle, elo, avatar, display_name FROM users WHERE id = $1",
        race["player1_id"],
    )
    p2 = await conn.fetchrow(
        "SELECT cf_handle, elo, avatar, display_name FROM users WHERE id = $1",
        race["player2_id"],
    )

    race["player1_handle"] = p1["cf_handle"] if p1 else None
    race["player2_handle"] = p2["cf_handle"] if p2 else None
    race["player1_avatar"] = p1["avatar"] if p1 else "avatar1"
    race["player2_avatar"] = p2["avatar"] if p2 else "avatar1"
    race["player1_elo"] = p1["elo"] if p1 else None
    race["player2_elo"] = p2["elo"] if p2 else None
    race["player1_name"] = p1["display_name"] or (p1["cf_handle"] if p1 else None)
    race["player2_name"] = p2["display_name"] or (p2["cf_handle"] if p2 else None)

    if race.get("winner_id"):
        w = await conn.fetchrow("SELECT cf_handle FROM users WHERE id = $1", race["winner_id"])
        race["winner_handle"] = w["cf_handle"] if w else None
    else:
        race["winner_handle"] = None

    # Convert datetimes to ISO strings with explicit UTC indicator
    for key in ["started_at", "ended_at"]:
        if race.get(key):
            dt = race[key]
            if isinstance(dt, datetime):
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                race[key] = dt.isoformat()
            else:
                race[key] = str(dt)

    # Convert UUIDs to strings
    for key in ["id", "player1_id", "player2_id", "winner_id"]:
        if race.get(key):
            race[key] = str(race[key])

    return race



async def check_and_finalize_race(conn, race_id: str) -> dict:
    """
    Check verdicts for both players and finalize the race if a winner is found or if time expired.
    """
    rid = uuid.UUID(race_id) if isinstance(race_id, str) else race_id
    race = await conn.fetchrow("SELECT * FROM races WHERE id = $1", rid)
    if not race:
        return None

    if race["status"] == "finished":
        return await get_race_details(conn, race_id)

    # Check 40-minute time limit expiry
    start_dt = race["started_at"]
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)
    now_dt = datetime.now(timezone.utc)
    elapsed_seconds = (now_dt - start_dt).total_seconds()

    RACE_LIMIT_SECONDS = 40 * 60  # 40 minutes

    p1 = await conn.fetchrow("SELECT id, cf_handle, elo, races_played FROM users WHERE id = $1", race["player1_id"])
    p2 = await conn.fetchrow("SELECT id, cf_handle, elo, races_played FROM users WHERE id = $1", race["player2_id"])

    if not p1 or not p2 or not p1["cf_handle"] or not p2["cf_handle"]:
        return await get_race_details(conn, race_id)

    problem_id = race["problem_id"]
    i = 0
    while i < len(problem_id) and problem_id[i].isdigit():
        i += 1
    contest_id = int(problem_id[:i])
    index = problem_id[i:]

    start_ts = int(start_dt.timestamp())

    p1_ts = await get_ac_timestamp(p1["cf_handle"], contest_id, index, start_ts)
    p2_ts = await get_ac_timestamp(p2["cf_handle"], contest_id, index, start_ts)

    winner, loser = None, None
    if p1_ts is not None and p2_ts is None:
        winner, loser = p1, p2
    elif p2_ts is not None and p1_ts is None:
        winner, loser = p2, p1
    elif p1_ts is not None and p2_ts is not None:

        if p1_ts <= p2_ts:
            winner, loser = p1, p2
        else:
            winner, loser = p2, p1

    if winner:
        new_w, new_l, w_change, l_change = calculate_elo(
            winner["elo"], loser["elo"],
            winner["races_played"], loser["races_played"],
        )

        result = await conn.execute(
            """
            UPDATE races
            SET status = 'finished', winner_id = $1, ended_at = NOW(),
                elo_applied = TRUE,
                p1_elo_after = CASE WHEN player1_id = $1 THEN $2 ELSE $3 END,
                p2_elo_after = CASE WHEN player2_id = $1 THEN $2 ELSE $3 END
            WHERE id = $4 AND elo_applied = FALSE
            """,
            winner["id"], new_w, new_l, rid,
        )

        if "UPDATE 1" in result:
            await conn.execute(
                "UPDATE users SET elo = $1, races_played = races_played + 1, races_won = races_won + 1 WHERE id = $2",
                new_w, winner["id"],
            )
            await conn.execute(
                "UPDATE users SET elo = $1, races_played = races_played + 1 WHERE id = $2",
                new_l, loser["id"],
            )
            await conn.execute(
                "INSERT INTO rating_history (user_id, race_id, elo_after, elo_change) VALUES ($1, $2, $3, $4)",
                winner["id"], rid, new_w, w_change,
            )
            await conn.execute(
                "INSERT INTO rating_history (user_id, race_id, elo_after, elo_change) VALUES ($1, $2, $3, $4)",
                loser["id"], rid, new_l, l_change,
            )
    elif elapsed_seconds >= RACE_LIMIT_SECONDS:
        # Time expired with no winner — finish race with no winner
        await conn.execute(
            """
            UPDATE races
            SET status = 'finished', winner_id = NULL, ended_at = NOW(),
                elo_applied = TRUE,
                p1_elo_after = p1_elo_before,
                p2_elo_after = p2_elo_before
            WHERE id = $1 AND elo_applied = FALSE
            """,
            rid,
        )

    return await get_race_details(conn, race_id)



async def get_race_verdicts(conn, race_id: str) -> dict:
    """
    Get the latest submission verdicts for both players in a race.
    """
    rid = uuid.UUID(race_id) if isinstance(race_id, str) else race_id
    race = await conn.fetchrow("SELECT * FROM races WHERE id = $1", rid)
    if not race:
        return {"player1": [], "player2": []}

    p1 = await conn.fetchrow("SELECT cf_handle FROM users WHERE id = $1", race["player1_id"])
    p2 = await conn.fetchrow("SELECT cf_handle FROM users WHERE id = $1", race["player2_id"])

    problem_id = race["problem_id"]
    i = 0
    while i < len(problem_id) and problem_id[i].isdigit():
        i += 1
    contest_id = int(problem_id[:i])
    index = problem_id[i:]
    start_ts = int(race["started_at"].timestamp())

    p1_verdicts = []
    p2_verdicts = []

    if p1 and p1["cf_handle"]:
        p1_verdicts = await get_all_submissions_verdicts(p1["cf_handle"], contest_id, index, start_ts)
    if p2 and p2["cf_handle"]:
        p2_verdicts = await get_all_submissions_verdicts(p2["cf_handle"], contest_id, index, start_ts)

    return {"player1": p1_verdicts, "player2": p2_verdicts}


