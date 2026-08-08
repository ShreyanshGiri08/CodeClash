"""
Application configuration via Pydantic Settings.

All configuration is loaded from environment variables (or a .env file).
This centralizes config so no module reads os.environ directly.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str
    DB_POOL_MIN_SIZE: int = 2
    DB_POOL_MAX_SIZE: int = 10

    # ── Auth ──────────────────────────────────────────────────
    JWT_SECRET: str = "dev-secret-change-this"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── Caching ───────────────────────────────────────────────
    # Problem statement cache TTL in seconds (1 hour default).
    # This avoids hammering Codeforces on repeated page loads.
    PROBLEM_CACHE_TTL: int = 3600
    # CF problemset list cache TTL (10 minutes).
    PROBLEMSET_CACHE_TTL: int = 600

    # ── Matchmaking ───────────────────────────────────────────
    # How long a user can wait in queue before timeout (seconds)
    MATCHMAKING_TIMEOUT: int = 120
    # Initial Elo band for matching (±100)
    MATCHMAKING_INITIAL_BAND: int = 100
    # Band expansion per interval (widens by 50 every 10s)
    MATCHMAKING_BAND_STEP: int = 50
    MATCHMAKING_BAND_INTERVAL: int = 10
    # Maximum band width
    MATCHMAKING_MAX_BAND: int = 500

    # ── Rate Limiting ─────────────────────────────────────────
    # In-memory sliding window rate limiter.
    # For production, this would be replaced with Redis + Lua scripts
    # for atomic, distributed rate limiting across multiple processes.
    RATE_LIMIT_QUEUE_PER_MINUTE: int = 20    # raised from 5 — allows repeated queue joins during dev
    RATE_LIMIT_CHECK_PER_MINUTE: int = 30
    RATE_LIMIT_DEFAULT_PER_MINUTE: int = 120


    # ── Race ──────────────────────────────────────────────────
    RACE_DURATION_MINUTES: int = 40
    VERDICT_POLL_INTERVAL: int = 4  # seconds between verdict checks

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton — parsed once, reused everywhere."""
    return Settings()
