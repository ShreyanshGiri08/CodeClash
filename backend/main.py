import os
from uuid import UUID
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

from auth import hash_password, verify_password, create_token, decode_token
from cf_client import get_cf_user_info, check_verdict, get_problem_statement
from matchmaking import try_match, get_random_problem, queue, queue_lock
from elo import calculate_elo
import random, string

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    return decode_token(creds.credentials)


def enrich_race(cur, race):
    """Attach player handles (and winner handle) to a race dict for frontend display"""
    race = dict(race)
    cur.execute("SELECT cf_handle FROM users WHERE id = %s", (race["player1_id"],))
    p1 = cur.fetchone()
    cur.execute("SELECT cf_handle FROM users WHERE id = %s", (race["player2_id"],))
    p2 = cur.fetchone()
    race["player1_handle"] = p1["cf_handle"] if p1 else None
    race["player2_handle"] = p2["cf_handle"] if p2 else None
    if race["winner_id"]:
        cur.execute("SELECT cf_handle FROM users WHERE id = %s", (race["winner_id"],))
        w = cur.fetchone()
        race["winner_handle"] = w["cf_handle"] if w else None
    else:
        race["winner_handle"] = None
    return race


# ---------- AUTH ----------

class SignupRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
def signup(body: SignupRequest, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
    if cur.fetchone():
        raise HTTPException(400, "Email already registered")
    hashed = hash_password(body.password)
    cur.execute(
        "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
        (body.email, hashed)
    )
    user_id = cur.fetchone()["id"]
    conn.commit()
    token = create_token(str(user_id))
    return {"token": token, "user_id": user_id}


class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/login")
def login(body: LoginRequest, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (body.email,))
    user = cur.fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(str(user["id"]))
    return {"token": token, "user_id": user["id"]}


@app.get("/me")
def me(user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT id, email, cf_handle, elo, races_played FROM users WHERE id = %s", (user_id,))
    return cur.fetchone()


# ---------- CF VERIFICATION ----------

@app.post("/cf/start-verification")
def start_verification(handle: str, user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    verify_code = "cph-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    cur = conn.cursor()
    cur.execute("UPDATE users SET cf_handle = %s, verify_code = %s WHERE id = %s",
                (handle, verify_code, user_id))
    conn.commit()
    return {
        "verify_code": verify_code,
        "instructions": f"Add '{verify_code}' to your Codeforces First Name field, then call /cf/confirm-verification"
    }


@app.post("/cf/confirm-verification")
async def confirm_verification(user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT cf_handle, verify_code FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or not row["cf_handle"]:
        raise HTTPException(400, "Set a handle first via /cf/start-verification")

    cf_info = await get_cf_user_info(row["cf_handle"])
    if not cf_info:
        raise HTTPException(400, "Codeforces handle not found")

    if row["verify_code"] not in (cf_info.get("firstName") or ""):
        raise HTTPException(400, "Verification code not found in profile")

    cur.execute("UPDATE users SET cf_verified = TRUE, verify_code = NULL WHERE id = %s", (user_id,))
    conn.commit()
    return {"status": "verified", "handle": row["cf_handle"]}


# ---------- MATCHMAKING ----------

@app.post("/races/queue")
async def join_queue(user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT elo FROM users WHERE id = %s", (user_id,))
    elo = cur.fetchone()["elo"]

    opponent = await try_match(user_id, elo)

    if opponent is None:
        return {"status": "waiting", "message": "Added to queue, searching for opponent"}

    avg_rating = (elo + opponent["elo"]) // 2
    target_rating = round(avg_rating / 100) * 100
    problem = await get_random_problem(target_rating)
    problem_id = f"{problem['contestId']}{problem['index']}"

    cur.execute(
        "INSERT INTO races (player1_id, player2_id, problem_id, status) VALUES (%s, %s, %s, 'active') RETURNING id",
        (user_id, opponent["user_id"], problem_id)
    )
    race_id = cur.fetchone()["id"]
    conn.commit()

    return {
        "status": "matched",
        "race_id": race_id,
        "opponent_id": opponent["user_id"],
        "problem_id": problem_id
    }


@app.delete("/races/queue")
async def leave_queue(user_id: str = Depends(get_current_user)):
    async with queue_lock:
        queue[:] = [e for e in queue if e["user_id"] != user_id]
    return {"status": "left queue"}


# ---------- RACE ----------

@app.get("/races/{race_id}")
def get_race(race_id: str, conn=Depends(get_db)):
    try:
        UUID(race_id)
    except ValueError:
        raise HTTPException(400, "Invalid race_id format")
    cur = conn.cursor()
    cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
    race = cur.fetchone()
    if not race:
        raise HTTPException(404, "Race not found")
    return enrich_race(cur, race)


@app.get("/races/{race_id}/problem")
async def race_problem(race_id: str, conn=Depends(get_db)):
    try:
        UUID(race_id)
    except ValueError:
        raise HTTPException(400, "Invalid race_id format")
    cur = conn.cursor()
    cur.execute("SELECT problem_id FROM races WHERE id = %s", (race_id,))
    race = cur.fetchone()
    if not race:
        raise HTTPException(404, "Race not found")

    contest_id = int(race["problem_id"][:-1])
    index = race["problem_id"][-1]
    return await get_problem_statement(contest_id, index)


@app.post("/races/{race_id}/check")
async def check_race_status(race_id: str, conn=Depends(get_db)):
    try:
        UUID(race_id)
    except ValueError:
        raise HTTPException(400, "Invalid race_id format")

    cur = conn.cursor()
    cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
    race = cur.fetchone()
    if not race:
        raise HTTPException(404, "Race not found")

    if race["status"] == "finished":
        return enrich_race(cur, race)

    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (race["player1_id"],))
    p1 = cur.fetchone()
    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (race["player2_id"],))
    p2 = cur.fetchone()

    contest_id = int(race["problem_id"][:-1])
    index = race["problem_id"][-1]
    start_ts = int(race["started_at"].timestamp())

    p1_solved = await check_verdict(p1["cf_handle"], contest_id, index, start_ts)
    p2_solved = await check_verdict(p2["cf_handle"], contest_id, index, start_ts)

    winner, loser = None, None
    if p1_solved:
        winner, loser = p1, p2
    elif p2_solved:
        winner, loser = p2, p1

    if winner:
        new_w, new_l = calculate_elo(winner["elo"], loser["elo"])
        cur.execute("UPDATE races SET status='finished', winner_id=%s, ended_at=NOW() WHERE id=%s",
                    (winner["id"], race_id))
        cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s", (new_w, winner["id"]))
        cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s", (new_l, loser["id"]))
        cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s,%s,%s)", (winner["id"], race_id, new_w))
        cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s,%s,%s)", (loser["id"], race_id, new_l))
        conn.commit()
        cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
        return enrich_race(cur, cur.fetchone())

    return enrich_race(cur, race)


# ---------- LEADERBOARD ----------

@app.get("/leaderboard")
def leaderboard(conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT cf_handle, elo, races_played FROM users ORDER BY elo DESC LIMIT 50")
    return cur.fetchall()