"""
Per-user rate limiting middleware using a sliding window algorithm.

HOW IT WORKS:
  - Each user (identified by JWT) has a list of request timestamps
  - On each request, we remove timestamps older than the window (1 minute)
  - If the remaining count exceeds the limit, we return 429 Too Many Requests
  - The Retry-After header tells the client when to retry

WHY IN-MEMORY:
  This is a single-process application, so a dict of lists is sufficient.
  For production with multiple workers/servers, you'd use Redis with a
  Lua script for atomic sliding window counting:
    MULTI
      ZREMRANGEBYSCORE user:rate:{user_id} 0 {now - window}
      ZADD user:rate:{user_id} {now} {request_id}
      ZCARD user:rate:{user_id}
    EXEC
  This ensures atomicity across concurrent requests and shared state
  across server instances.

MEMORY MANAGEMENT:
  We lazily clean up user entries that haven't been seen in 5 minutes
  to prevent unbounded memory growth from users who visit once and leave.
"""

import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException

logger = logging.getLogger("codeclash.ratelimit")

# user_id → list of request timestamps
_buckets: dict[str, list[float]] = defaultdict(list)
_last_cleanup = time.time()
CLEANUP_INTERVAL = 300  # Clean up stale entries every 5 minutes


def _cleanup_stale_entries():
    """Remove entries for users who haven't made requests in 5+ minutes."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    stale_users = [
        uid for uid, timestamps in _buckets.items()
        if not timestamps or (now - max(timestamps)) > CLEANUP_INTERVAL
    ]
    for uid in stale_users:
        del _buckets[uid]


def check_rate_limit(user_id: str, limit: int, window: int = 60):
    """
    Check if a user has exceeded their rate limit.

    Args:
        user_id: The user to check
        limit: Maximum requests allowed in the window
        window: Time window in seconds (default 60)

    Raises:
        HTTPException(429) if rate limit exceeded
    """
    _cleanup_stale_entries()

    now = time.time()
    timestamps = _buckets[user_id]

    # Remove timestamps outside the window
    _buckets[user_id] = [t for t in timestamps if now - t < window]
    timestamps = _buckets[user_id]

    if len(timestamps) >= limit:
        # Calculate when the oldest request in the window will expire
        retry_after = int(window - (now - timestamps[0])) + 1
        logger.warning(
            "Rate limit exceeded",
            extra={"user_id": user_id, "limit": limit, "count": len(timestamps)},
        )
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )

    # Record this request
    timestamps.append(now)
