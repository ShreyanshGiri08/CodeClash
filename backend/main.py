import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from auth import hash_password, verify_password, create_token, decode_token

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

from cf_client import get_cf_user_info
import random, string

@app.post("/cf/start-verification")
def start_verification(handle: str, user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    verify_code = "cph-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    cur = conn.cursor()
    cur.execute("UPDATE users SET cf_handle = %s, verify_code = %s WHERE id = %s",
                (handle, verify_code, user_id))
    conn.commit()
    return {"verify_code": verify_code, "instructions": f"Apne Codeforces profile ke 'First Name' field mein '{verify_code}' temporarily daal do, phir /cf/confirm-verification call karo"}

@app.post("/cf/confirm-verification")
async def confirm_verification(user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT cf_handle, verify_code FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or not row["cf_handle"]:
        raise HTTPException(400, "Pehle handle set karo /cf/start-verification se")

    cf_info = await get_cf_user_info(row["cf_handle"])
    if not cf_info:
        raise HTTPException(400, "CF handle nahi mila")

    if row["verify_code"] not in (cf_info.get("firstName") or ""):
        raise HTTPException(400, "Verification code profile mein nahi mila")

    cur.execute("UPDATE users SET cf_verified = TRUE, verify_code = NULL WHERE id = %s", (user_id,))
    conn.commit()
    return {"status": "verified", "handle": row["cf_handle"]}

from matchmaking import try_match, get_random_problem, queue
import asyncio

@app.post("/races/queue")
async def join_queue(user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT elo FROM users WHERE id = %s", (user_id,))
    elo = cur.fetchone()["elo"]

    opponent = await try_match(user_id, elo)

    if opponent is None:
        return {"status": "waiting", "message": "Queue mein daal diya, opponent dhoondh rahe hain"}

    # Match mil gaya — race create karo
    avg_rating = (elo + opponent["elo"]) // 2
    # round to nearest 100 (CF ratings 800,900...3500 hote hain)
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
    return race

@app.delete("/races/queue")
async def leave_queue(user_id: str = Depends(get_current_user)):
    async with __import__("matchmaking").queue_lock:
        queue[:] = [e for e in queue if e["user_id"] != user_id]
    return {"status": "left queue"}

from cf_client import check_verdict
from elo import calculate_elo
import time

@app.post("/races/{race_id}/check")
async def check_race_status(race_id: str, conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
    race = cur.fetchone()
    if not race:
        raise HTTPException(404, "Race not found")

    if race["status"] == "finished":
        return race  # already khatam ho chuki

    # dono players ka handle nikaalo
    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (race["player1_id"],))
    p1 = cur.fetchone()
    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (race["player2_id"],))
    p2 = cur.fetchone()

    contest_id = int(race["problem_id"][:-1])  # e.g. "1794C" -> 1794
    index = race["problem_id"][-1]             # "C"
    start_ts = int(race["started_at"].timestamp())

    p1_solved = await check_verdict(p1["cf_handle"], contest_id, index, start_ts)
    p2_solved = await check_verdict(p2["cf_handle"], contest_id, index, start_ts)

    winner = None
    if p1_solved:
        winner = p1
        loser = p2
    elif p2_solved:
        winner = p2
        loser = p1

    if winner:
        new_winner_elo, new_loser_elo = calculate_elo(winner["elo"], loser["elo"])

        cur.execute("UPDATE races SET status='finished', winner_id=%s, ended_at=NOW() WHERE id=%s",
                    (winner["id"], race_id))
        cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s",
                    (new_winner_elo, winner["id"]))
        cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s",
                    (new_loser_elo, loser["id"]))

        cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s, %s, %s)",
                    (winner["id"], race_id, new_winner_elo))
        cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s, %s, %s)",
                    (loser["id"], race_id, new_loser_elo))

        conn.commit()
        cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
        return cur.fetchone()

    return race  # abhi tak koi nahi jeeta

from uuid import UUID

@app.post("/races/{race_id}/check")
async def check_race_status(race_id: str, conn=Depends(get_db)):
    try:
        UUID(race_id)
    except ValueError:
        raise HTTPException(400, "Invalid race_id format")
  

from cf_client import get_problem_statement

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

def finalize_race(cur, race_id, winner, loser):
    new_winner_elo, new_loser_elo = calculate_elo(winner["elo"], loser["elo"])
    cur.execute("UPDATE races SET status='finished', winner_id=%s, ended_at=NOW() WHERE id=%s",
                (winner["id"], race_id))
    cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s",
                (new_winner_elo, winner["id"]))
    cur.execute("UPDATE users SET elo=%s, races_played=races_played+1 WHERE id=%s",
                (new_loser_elo, loser["id"]))
    cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s,%s,%s)",
                (winner["id"], race_id, new_winner_elo))
    cur.execute("INSERT INTO rating_history (user_id, race_id, elo_after) VALUES (%s,%s,%s)",
                (loser["id"], race_id, new_loser_elo))


class SubmitLinkRequest(BaseModel):
    link: str

@app.post("/races/{race_id}/submit-link")
async def submit_link(race_id: str, body: SubmitLinkRequest,
                       user_id: str = Depends(get_current_user), conn=Depends(get_db)):
    cur = conn.cursor()
    cur.execute("SELECT * FROM races WHERE id = %s", (race_id,))
    race = cur.fetchone()
    if not race or race["status"] == "finished":
        raise HTTPException(400, "Race not active")

    parsed = parse_submission_link(body.link)
    if not parsed:
        raise HTTPException(400, "Invalid submission link format")
    contest_id, submission_id = parsed

    expected_problem = race["problem_id"]
    if f"{contest_id}" not in expected_problem:
        raise HTTPException(400, "Submission link doesn't match race problem")

    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (user_id,))
    me = cur.fetchone()
    other_id = race["player2_id"] if race["player1_id"] == user_id else race["player1_id"]
    cur.execute("SELECT id, cf_handle, elo FROM users WHERE id = %s", (other_id,))
    opponent = cur.fetchone()

    sub = await get_submission_by_id(me["cf_handle"], submission_id)
    if not sub:
        raise HTTPException(400, "Submission nahi mila tumhare CF profile pe")
    if sub["verdict"] != "OK":
        raise HTTPException(400, f"Verdict abhi {sub['verdict']} hai, AC nahi")
    if sub["creationTimeSeconds"] < int(race["started_at"].timestamp()):
        raise HTTPException(400, "Yeh submission race shuru hone se pehle ka hai")

    finalize_race(cur, race_id, winner=me, loser=opponent)
    conn.commit()
    return {"status": "won", "race_id": race_id}