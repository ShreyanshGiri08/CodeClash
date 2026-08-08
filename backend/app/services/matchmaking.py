"""
Matchmaking service — in-memory queue with expanding band search.

HOW IT WORKS:
  1. User calls POST /races/queue → added to an in-memory list with their Elo + timestamp
  2. On each join, we check if any existing queue entry is within the Elo band
  3. The band starts narrow (±100) and EXPANDS the longer someone waits:
     - 0-10s:  ±100
     - 10-20s: ±150
     - 20-30s: ±200
     - ...up to ±500 max
  4. If no match is found within MATCHMAKING_TIMEOUT seconds, the entry is removed
     and the user is told to retry.

WHY IN-MEMORY (not Redis/DB):
  - Zero external dependencies for the free tier
  - Single-process deployment means the in-memory list is always consistent
  - For production with multiple server instances, you'd move to:
    Redis Sorted Set (ZADD by Elo, ZRANGEBYSCORE for band matching)
    with distributed locking (SETNX) to prevent double-matching

CONCURRENCY:
  We use asyncio.Lock to prevent race conditions where two simultaneous
  requests could both match with the same queued user.
"""

import asyncio
import time
import logging
from typing import Optional
from app.config import get_settings

logger = logging.getLogger("codeclash.matchmaking")

# In-memory queue: list of dicts {user_id, elo, joined_at}
queue: list[dict] = []
queue_lock = asyncio.Lock()

# Track matched results so the poller can find them
# Maps user_id → {race_id, opponent_id, opponent_handle}
match_results: dict[str, dict] = {}


def _get_current_band(joined_at: float) -> int:
    """
    Calculate the current Elo band width based on how long the user has waited.
    Band expands by BAND_STEP every BAND_INTERVAL seconds, up to MAX_BAND.
    """
    settings = get_settings()
    elapsed = time.time() - joined_at
    expansions = int(elapsed / settings.MATCHMAKING_BAND_INTERVAL)
    band = settings.MATCHMAKING_INITIAL_BAND + (expansions * settings.MATCHMAKING_BAND_STEP)
    return min(band, settings.MATCHMAKING_MAX_BAND)


async def add_to_queue(user_id: str, elo: int) -> Optional[dict]:
    """
    Add a user to the matchmaking queue and attempt to find a match.

    Returns:
      - A dict with opponent info if a match is found immediately
      - None if added to queue (waiting for an opponent)

    The expanding band logic works from BOTH sides: when user A joins,
    we check A's band against all queued users. But we also check each
    queued user's band (which has widened over time) against A.
    """
    settings = get_settings()

    async with queue_lock:
        # Don't add if already in queue
        for entry in queue:
            if entry["user_id"] == user_id:
                return None

        now = time.time()

        # Try to find a match using expanding band from both sides
        for i, entry in enumerate(queue):
            # Check if the new user's initial band reaches the queued user
            new_user_band = settings.MATCHMAKING_INITIAL_BAND
            # Check if the queued user's (expanded) band reaches the new user
            queued_band = _get_current_band(entry["joined_at"])

            elo_diff = abs(entry["elo"] - elo)

            if elo_diff <= new_user_band or elo_diff <= queued_band:
                # Match found!
                opponent = queue.pop(i)
                logger.info(
                    "Match found",
                    extra={
                        "user1": user_id,
                        "user2": opponent["user_id"],
                        "elo_diff": elo_diff,
                        "wait_seconds": round(now - opponent["joined_at"], 1),
                    },
                )
                return opponent

        # No match — add to queue
        queue.append({"user_id": user_id, "elo": elo, "joined_at": now})
        logger.info("Added to queue", extra={"user_id": user_id, "elo": elo, "queue_size": len(queue)})
        return None


async def remove_from_queue(user_id: str):
    """Remove a user from the matchmaking queue."""
    async with queue_lock:
        queue[:] = [e for e in queue if e["user_id"] != user_id]
        logger.info("Removed from queue", extra={"user_id": user_id})


async def get_queue_status(user_id: str) -> dict:
    """
    Check if a user is still in the queue, has been matched, or has timed out.
    """
    settings = get_settings()

    # Check if there's a match result waiting
    if user_id in match_results:
        result = match_results.pop(user_id)
        return {"status": "matched", **result}

    async with queue_lock:
        for entry in queue:
            if entry["user_id"] == user_id:
                elapsed = time.time() - entry["joined_at"]
                if elapsed > settings.MATCHMAKING_TIMEOUT:
                    # Timed out — remove from queue
                    queue[:] = [e for e in queue if e["user_id"] != user_id]
                    return {
                        "status": "timeout",
                        "message": f"No opponent found in {settings.MATCHMAKING_TIMEOUT}s. Try again or widen your search.",
                    }
                return {
                    "status": "waiting",
                    "elapsed": round(elapsed),
                    "band": _get_current_band(entry["joined_at"]),
                    "queue_size": len(queue),
                }

    return {"status": "not_in_queue"}


def store_match_result(user_id: str, result: dict):
    """Store a match result for a user to pick up on their next poll."""
    match_results[user_id] = result


def get_queue_stats() -> dict:
    """Return current queue statistics for display."""
    return {
        "queued": len(queue),
        "playing": 0,  # Could track active races if needed
    }
