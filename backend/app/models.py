"""
Pydantic models for request/response validation.
Separating these from routers keeps the API contract clear and testable.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# ── Auth ────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: str


# ── User ────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    email: str
    cf_handle: Optional[str] = None
    cf_verified: bool = False
    elo: int = 1200
    races_played: int = 0
    races_won: int = 0
    avatar: str = "avatar1"
    display_name: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar: Optional[str] = None


# ── Codeforces Verification ─────────────────────────────────

class StartVerificationRequest(BaseModel):
    handle: str = Field(..., min_length=1, max_length=100)


class VerificationResponse(BaseModel):
    verify_code: str
    instructions: str


# ── Matchmaking ─────────────────────────────────────────────

class QueueStatusResponse(BaseModel):
    status: str  # "waiting" | "matched" | "timeout"
    message: Optional[str] = None
    race_id: Optional[str] = None
    opponent_handle: Optional[str] = None


# ── Race ────────────────────────────────────────────────────

class RaceResponse(BaseModel):
    id: str
    player1_id: str
    player2_id: str
    player1_handle: Optional[str] = None
    player2_handle: Optional[str] = None
    player1_avatar: Optional[str] = None
    player2_avatar: Optional[str] = None
    player1_elo: Optional[int] = None
    player2_elo: Optional[int] = None
    problem_id: str
    problem_rating: Optional[int] = None
    status: str
    winner_id: Optional[str] = None
    winner_handle: Optional[str] = None
    elo_applied: bool = False
    p1_elo_before: Optional[int] = None
    p2_elo_before: Optional[int] = None
    p1_elo_after: Optional[int] = None
    p2_elo_after: Optional[int] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    race_type: str = "ranked"


class ProblemResponse(BaseModel):
    title: str
    html: str
    url: str
    contest_id: Optional[int] = None
    index: Optional[str] = None


# ── Challenge ───────────────────────────────────────────────

class CreateChallengeRequest(BaseModel):
    problem_rating: int = Field(default=1200, ge=800, le=3500)
    tags: Optional[list[str]] = None
    duration_minutes: Optional[int] = 40



class ChallengeResponse(BaseModel):
    token: str
    share_url: str
    status: str
    creator_handle: Optional[str] = None
    creator_elo: Optional[int] = None
    problem_rating: int = 1200


# ── Leaderboard ─────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    id: str
    cf_handle: Optional[str] = None
    display_name: Optional[str] = None
    elo: int
    races_played: int
    races_won: int
    avatar: str = "avatar1"


# ── Rating History ──────────────────────────────────────────

class RatingHistoryEntry(BaseModel):
    elo_after: int
    elo_change: Optional[int] = None
    recorded_at: str
    race_id: Optional[str] = None
