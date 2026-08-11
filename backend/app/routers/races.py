import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.dependencies import get_current_user, get_db
from app.services.matchmaking import add_to_queue, remove_from_queue, get_queue_status, store_match_result, get_queue_stats
from app.services.cf_service import get_random_problem, get_problem_statement
from app.services.race_service import create_race, get_race_details, check_and_finalize_race, get_race_verdicts
from app.middleware.rate_limiter import check_rate_limit
from app.config import get_settings

router = APIRouter(prefix="/races", tags=["races"])
logger = logging.getLogger("codeclash.races")


@router.post("/queue")
async def join_queue(
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Join the matchmaking queue. Rate-limited to prevent abuse.
    If a match is found immediately, creates a race and returns its ID.
    Otherwise, adds the user to the queue for polling.
    """
    settings = get_settings()
    check_rate_limit(user_id, settings.RATE_LIMIT_QUEUE_PER_MINUTE)

    # Get user's current Elo
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    user = await conn.fetchrow("SELECT elo, cf_handle, cf_verified FROM users WHERE id = $1", uid)
    if not user:
        raise HTTPException(404, "User not found")
    if not user["cf_verified"]:
        raise HTTPException(400, "Verify your Codeforces handle first")

    opponent = await add_to_queue(user_id, user["elo"])

    if opponent is None:
        return {"status": "waiting", "message": "Added to queue, searching for opponent..."}

    # Match found — create a race
    avg_elo = (user["elo"] + opponent["elo"]) // 2
    target_rating = round(avg_elo / 100) * 100
    problem = await get_random_problem(target_rating)
    problem_id = f"{problem['contestId']}{problem['index']}"

    race = await create_race(
        conn, user_id, opponent["user_id"],
        problem_id, problem.get("rating"), "ranked",
    )
    race_id = str(race["id"])

    # Store result for the opponent to pick up when they poll
    store_match_result(opponent["user_id"], {
        "race_id": race_id,
        "opponent_id": user_id,
    })

    return {
        "status": "matched",
        "race_id": race_id,
        "opponent_id": opponent["user_id"],
        "problem_id": problem_id,
    }


@router.get("/queue/status")
async def queue_status(user_id: str = Depends(get_current_user)):
    """Poll for match status while in queue."""
    status = await get_queue_status(user_id)
    return status


@router.get("/queue/stats")
async def queue_stats():
    """Get current queue statistics (public, no auth required)."""
    return get_queue_stats()


@router.delete("/queue")
async def leave_queue(user_id: str = Depends(get_current_user)):
    """Leave the matchmaking queue."""
    await remove_from_queue(user_id)
    return {"status": "left queue"}


@router.get("/{race_id}")
async def get_race(
    race_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get race details with player info."""
    race = await get_race_details(conn, race_id)
    if not race:
        raise HTTPException(404, "Race not found")
    return race


@router.get("/{race_id}/problem")
async def get_race_problem(
    race_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get the cached problem statement for a race."""
    rid = uuid.UUID(race_id) if isinstance(race_id, str) else race_id
    race = await conn.fetchrow("SELECT problem_id FROM races WHERE id = $1", rid)
    if not race:
        raise HTTPException(404, "Race not found")

    problem_id = race["problem_id"]
    # Parse: "1794C" → contest=1794, index="C"
    i = 0
    while i < len(problem_id) and problem_id[i].isdigit():
        i += 1
    contest_id = int(problem_id[:i])
    index = problem_id[i:]

    return await get_problem_statement(contest_id, index)


@router.post("/{race_id}/check")
async def check_race(
    race_id: str,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Check verdicts and potentially finalize the race.
    Rate-limited to prevent hammering the CF API.
    """
    settings = get_settings()
    check_rate_limit(user_id, settings.RATE_LIMIT_CHECK_PER_MINUTE)

    result = await check_and_finalize_race(conn, race_id)
    if not result:
        raise HTTPException(404, "Race not found")
    
    # Broadcast updated race state to connected WebSockets
    from app.services.websocket_manager import ws_manager
    await ws_manager.broadcast(race_id, {"type": "RACE_UPDATE", "race": result})
    return result



@router.get("/{race_id}/verdicts")
async def get_verdicts(
    race_id: str,
    conn: asyncpg.Connection = Depends(get_db),
):
    """Get current verdicts for both players in the race."""
    return await get_race_verdicts(conn, race_id)


@router.post("/{race_id}/forfeit")
async def forfeit_race(
    race_id: str,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Forfeit (throw in the towel) — opponent wins."""
    rid = uuid.UUID(race_id) if isinstance(race_id, str) else race_id
    race = await conn.fetchrow("SELECT * FROM races WHERE id = $1", rid)
    if not race:
        raise HTTPException(404, "Race not found")
    if race["status"] == "finished":
        raise HTTPException(400, "Race already finished")
    if str(race["player1_id"]) != user_id and str(race["player2_id"]) != user_id:
        raise HTTPException(403, "You're not in this race")

    # The other player wins
    winner_id = str(race["player2_id"]) if str(race["player1_id"]) == user_id else str(race["player1_id"])

    from app.services.elo_service import calculate_elo
    winner_uid = uuid.UUID(winner_id)
    loser_uid = uuid.UUID(user_id)

    winner = await conn.fetchrow("SELECT elo, races_played FROM users WHERE id = $1", winner_uid)
    loser = await conn.fetchrow("SELECT elo, races_played FROM users WHERE id = $1", loser_uid)

    new_w, new_l, w_change, l_change = calculate_elo(
        winner["elo"], loser["elo"], winner["races_played"], loser["races_played"]
    )

    result = await conn.execute(
        """UPDATE races SET status='finished', winner_id=$1, ended_at=NOW(),
           elo_applied=TRUE, 
           p1_elo_after=CASE WHEN player1_id=$1 THEN $2::integer ELSE $3::integer END,
           p2_elo_after=CASE WHEN player2_id=$1 THEN $2::integer ELSE $3::integer END
           WHERE id=$4 AND elo_applied=FALSE""",
        winner_uid, new_w, new_l, rid,
    )


    if "UPDATE 1" in result:
        await conn.execute("UPDATE users SET elo=$1, races_played=races_played+1, races_won=races_won+1 WHERE id=$2", new_w, winner_uid)
        await conn.execute("UPDATE users SET elo=$1, races_played=races_played+1 WHERE id=$2", new_l, loser_uid)
        await conn.execute("INSERT INTO rating_history (user_id, race_id, elo_after, elo_change) VALUES ($1,$2,$3,$4)", winner_uid, rid, new_w, w_change)
        await conn.execute("INSERT INTO rating_history (user_id, race_id, elo_after, elo_change) VALUES ($1,$2,$3,$4)", loser_uid, rid, new_l, l_change)

    race_data = await get_race_details(conn, race_id)
    # Broadcast forfeit event over WebSocket
    from app.services.websocket_manager import ws_manager
    await ws_manager.broadcast(race_id, {"type": "RACE_UPDATE", "race": race_data})
    return race_data


from fastapi import WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager

@router.websocket("/ws/{race_id}")
async def race_websocket_endpoint(websocket: WebSocket, race_id: str):
    """
    WebSocket endpoint for real-time race events, instant verdict updates, and opponent signals.
    """
    await ws_manager.connect(race_id, websocket)
    try:
        while True:
            # Receive ping or client signals
            data = await websocket.receive_json()
            event_type = data.get("type")
            if event_type == "PING":
                await websocket.send_json({"type": "PONG"})
            elif event_type == "CHECK_SUBMISSION":
                # Broadcast checking status to opponent
                await ws_manager.broadcast(race_id, {
                    "type": "OPPONENT_CHECKING",
                    "user_id": data.get("user_id"),
                })
    except WebSocketDisconnect:
        ws_manager.disconnect(race_id, websocket)
    except Exception:
        ws_manager.disconnect(race_id, websocket)



