"""
Database connection pool using asyncpg.

WHY CONNECTION POOLING:
  Opening a new TCP + SSL connection to Neon PostgreSQL for every HTTP request
  adds ~50-100ms of latency per request and wastes resources. A connection pool
  maintains a set of pre-established connections that are borrowed per-request
  and returned when done — amortizing the handshake cost across thousands of
  requests.

  asyncpg.create_pool() manages this automatically:
    - min_size: keep at least N connections warm (avoids cold-start on first request)
    - max_size: cap at N to prevent overwhelming the DB server
    - Connections are health-checked and recycled automatically

  For production with multiple server processes, you'd add PgBouncer as an
  external pooler to share connections across processes.
"""

import asyncpg
import logging
from app.config import get_settings

logger = logging.getLogger("codeclash.database")

# Module-level pool reference — initialized on app startup
_pool: asyncpg.Pool | None = None


async def create_pool() -> asyncpg.Pool:
    """Create the asyncpg connection pool. Called once during app startup."""
    global _pool
    settings = get_settings()

    # Neon requires SSL; pass ssl="require" explicitly for asyncpg compatibility
    _pool = await asyncpg.create_pool(
        dsn=settings.DATABASE_URL,
        min_size=settings.DB_POOL_MIN_SIZE,
        max_size=settings.DB_POOL_MAX_SIZE,
        command_timeout=30,
        ssl="require",
    )
    logger.info(
        "Database pool created",
        extra={"min_size": settings.DB_POOL_MIN_SIZE, "max_size": settings.DB_POOL_MAX_SIZE},
    )
    return _pool


async def close_pool():
    """Gracefully close all connections. Called during app shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        logger.info("Database pool closed")
        _pool = None


async def get_or_create_pool() -> asyncpg.Pool:
    """Return active pool, or lazily initialize if not yet created."""
    global _pool
    if _pool is None:
        await create_pool()
    return _pool


def get_pool() -> asyncpg.Pool:
    """Return the active pool. Raises if pool hasn't been created yet."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized — call create_pool() first")
    return _pool



async def init_schema():
    """
    Run the database schema migration.
    In production you'd use Alembic; here we run idempotent CREATE IF NOT EXISTS
    statements so the app is self-bootstrapping.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                cf_handle VARCHAR(100),
                cf_verified BOOLEAN DEFAULT FALSE,
                verify_code VARCHAR(20),
                elo INTEGER DEFAULT 1200,
                races_played INTEGER DEFAULT 0,
                races_won INTEGER DEFAULT 0,
                avatar VARCHAR(50) DEFAULT 'avatar1',
                display_name VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Ensure all columns exist if table was created previously on Neon
            ALTER TABLE users ADD COLUMN IF NOT EXISTS cf_handle VARCHAR(100);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS cf_verified BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_code VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS elo INTEGER DEFAULT 1200;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS races_played INTEGER DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS races_won INTEGER DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(50) DEFAULT 'avatar1';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);


            CREATE TABLE IF NOT EXISTS races (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                player1_id UUID REFERENCES users(id),
                player2_id UUID REFERENCES users(id),
                problem_id VARCHAR(20) NOT NULL,
                problem_rating INTEGER,
                status VARCHAR(20) DEFAULT 'active',
                winner_id UUID REFERENCES users(id),
                elo_applied BOOLEAN DEFAULT FALSE,
                p1_elo_before INTEGER,
                p2_elo_before INTEGER,
                p1_elo_after INTEGER,
                p2_elo_after INTEGER,
                started_at TIMESTAMPTZ DEFAULT NOW(),
                ended_at TIMESTAMPTZ,
                race_type VARCHAR(20) DEFAULT 'ranked'
            );

            -- Ensure columns exist if races table was created previously
            ALTER TABLE races ADD COLUMN IF NOT EXISTS problem_rating INTEGER;
            ALTER TABLE races ADD COLUMN IF NOT EXISTS race_type VARCHAR(20) DEFAULT 'ranked';
            ALTER TABLE races ADD COLUMN IF NOT EXISTS elo_applied BOOLEAN DEFAULT FALSE;
            ALTER TABLE races ADD COLUMN IF NOT EXISTS p1_elo_before INTEGER;
            ALTER TABLE races ADD COLUMN IF NOT EXISTS p2_elo_before INTEGER;
            ALTER TABLE races ADD COLUMN IF NOT EXISTS p1_elo_after INTEGER;
            ALTER TABLE races ADD COLUMN IF NOT EXISTS p2_elo_after INTEGER;


            CREATE TABLE IF NOT EXISTS rating_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                race_id UUID REFERENCES races(id),
                elo_after INTEGER NOT NULL,
                elo_change INTEGER,
                recorded_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS challenges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(32) UNIQUE NOT NULL,
                creator_id UUID REFERENCES users(id),
                problem_rating INTEGER DEFAULT 1200,
                race_duration_minutes INTEGER DEFAULT 40,
                race_id UUID REFERENCES races(id),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ
            );
        """)
        logger.info("Database schema initialized")

