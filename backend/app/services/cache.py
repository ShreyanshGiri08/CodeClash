"""
In-memory TTL cache for server-side caching.

WHY IN-MEMORY:
  This app runs as a single process, so an in-memory dict is the simplest
  and fastest caching option with zero external dependencies. Every cache
  hit avoids a network round-trip to Codeforces.

TRADE-OFFS:
  - Cache is lost on server restart (acceptable — it's just a warm-up cost)
  - Not shared across multiple server processes (for production with
    multiple workers, you'd use Redis with TTL keys: `SET key value EX 3600`)
  - Memory-bounded by the number of unique problems (~10k × ~5KB = ~50MB max,
    which is fine for a single server)

USAGE:
  cache = TTLCache()
  cache.set("1794C", html_content, ttl=3600)  # cache for 1 hour
  result = cache.get("1794C")  # returns None if expired
"""

import time
import logging
from typing import Any, Optional

logger = logging.getLogger("codeclash.cache")


class TTLCache:
    """
    Simple in-memory cache with per-key TTL (time-to-live).
    Thread-safe enough for async (single-threaded event loop).
    """

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a cached value. Returns None if the key doesn't exist
        or has expired (lazy expiration — we don't run a background cleaner).
        """
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expiry = entry
        if time.time() > expiry:
            # Expired — remove and return None
            del self._store[key]
            logger.debug("Cache expired", extra={"key": key})
            return None
        logger.debug("Cache hit", extra={"key": key})
        return value

    def set(self, key: str, value: Any, ttl: int):
        """
        Store a value with a TTL in seconds.
        Overwrites any existing entry for the same key.
        """
        expiry = time.time() + ttl
        self._store[key] = (value, expiry)
        logger.debug("Cache set", extra={"key": key, "ttl": ttl})

    def invalidate(self, key: str):
        """Remove a specific key from the cache."""
        self._store.pop(key, None)

    def clear(self):
        """Remove all cached entries."""
        self._store.clear()

    def size(self) -> int:
        """Return the number of (possibly expired) entries."""
        return len(self._store)


# Global cache instances — one for problem statements, one for problemset list
problem_cache = TTLCache()
problemset_cache = TTLCache()
