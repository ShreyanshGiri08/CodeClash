"""
CodeClash Backend — FastAPI Application Factory

This is the entry point for the backend. It:
  1. Sets up structured logging
  2. Creates the FastAPI app with CORS middleware
  3. Registers all routers (auth, users, CF, races, challenges, leaderboard, health)
  4. Manages the database connection pool lifecycle (startup/shutdown)
  5. Adds request logging middleware
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_pool, close_pool, init_schema
from app.middleware.logging_config import setup_logging, RequestLoggingMiddleware

# Import all routers
from app.routers import auth, users, codeforces, races, challenges, leaderboard, health


# ── Lifespan (startup + shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle:
      - Startup: create DB pool, run migrations
      - Shutdown: close DB pool gracefully
    """
    logger = logging.getLogger("codeclash.app")

    # ── Startup ──
    setup_logging()
    logger.info("Starting CodeClash backend...")

    await create_pool()
    await init_schema()

    logger.info("CodeClash backend ready")
    yield

    # ── Shutdown ──
    logger.info("Shutting down CodeClash backend...")
    await close_pool()
    logger.info("Shutdown complete")


# ── App Factory ──────────────────────────────────────────────
def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="CodeClash API",
        description="1v1 Competitive Programming Racing Platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ── CORS ──
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


    # ── Request Logging ──
    app.add_middleware(RequestLoggingMiddleware)

    # ── Register Routers ──
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(codeforces.router)
    app.include_router(races.router)
    app.include_router(challenges.router)
    app.include_router(leaderboard.router)
    app.include_router(health.router)

    return app


# Create the app instance — uvicorn will import this
app = create_app()
