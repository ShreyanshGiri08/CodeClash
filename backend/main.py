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