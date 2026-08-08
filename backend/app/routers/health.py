"""
Health check endpoint — verifies DB connectivity.

This is essential for monitoring and load balancers:
  - Returns 200 + {"status": "healthy"} if the DB is reachable
  - Returns 503 + {"status": "unhealthy"} if the DB connection fails
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from app.database import get_pool

router = APIRouter(tags=["health"])
logger = logging.getLogger("codeclash.health")


@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies database connectivity.
    Used by monitoring systems and load balancers to determine
    if this instance is ready to serve traffic.
    """
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {
            "status": "healthy",
            "db": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Health check failed", extra={"error": str(e)})
        return {
            "status": "unhealthy",
            "db": "disconnected",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
