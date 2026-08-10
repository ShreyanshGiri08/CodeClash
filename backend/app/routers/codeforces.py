"""
Codeforces handle verification routes.

VERIFICATION FLOW:
  1. User POSTs their CF handle → we generate a random code (e.g., "clash-abc123")
  2. User puts this code in their Codeforces profile's "First Name" field
  3. User calls confirm → we check the CF API to see if the code is there
  4. If found → mark handle as verified, clear the code
"""

import uuid
import random
import string
import logging
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.models import StartVerificationRequest
from app.services.cf_service import get_cf_user_info
from app.dependencies import get_current_user, get_db

router = APIRouter(prefix="/cf", tags=["codeforces"])
logger = logging.getLogger("codeclash.cf")


@router.post("/start-verification")
async def start_verification(
    body: StartVerificationRequest,
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Start the CF handle verification process.
    Generates a random code the user must place in their CF profile.
    """
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id

    # Verify the handle exists on Codeforces
    cf_info = await get_cf_user_info(body.handle)
    if not cf_info:
        raise HTTPException(400, "Codeforces handle not found on codeforces.com")

    # Generate verification code
    verify_code = "clash-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))

    await conn.execute(
        "UPDATE users SET cf_handle = $1, verify_code = $2, cf_verified = FALSE WHERE id = $3",
        body.handle, verify_code, uid,
    )

    logger.info("Verification started", extra={"user_id": user_id, "handle": body.handle})
    return {
        "verify_code": verify_code,
        "instructions": f"Set your Codeforces First Name to contain '{verify_code}', then click verify.",
        "cf_settings_url": "https://codeforces.com/settings/social",
    }


@router.post("/confirm-verification")
async def confirm_verification(
    user_id: str = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db),
):
    """
    Confirm the verification by checking the CF API.
    Checks First Name, Last Name, and Organization fields case-insensitively.
    If another account had this handle, ownership shifts to this verified user.
    """
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    row = await conn.fetchrow(
        "SELECT cf_handle, verify_code FROM users WHERE id = $1", uid
    )
    if not row or not row["cf_handle"]:
        raise HTTPException(400, "Start verification first")
    if not row["verify_code"]:
        raise HTTPException(400, "No pending verification code found")

    cf_info = await get_cf_user_info(row["cf_handle"])
    if not cf_info:
        raise HTTPException(400, f"Could not fetch handle '{row['cf_handle']}' from Codeforces API. Please try again.")

    first_name = str(cf_info.get("firstName") or "")
    last_name = str(cf_info.get("lastName") or "")
    organization = str(cf_info.get("organization") or "")

    code = row["verify_code"].strip().lower()
    profile_combined = f"{first_name} {last_name} {organization} {str(cf_info)}".lower()

    logger.info("CF user info retrieved", extra={"handle": row["cf_handle"], "cf_info": cf_info})

    if code not in profile_combined:
        found_fn = first_name if first_name else "(empty)"
        raise HTTPException(
            400,
            f"Code '{row['verify_code']}' not detected on Codeforces yet (Current First Name: '{found_fn}'). Make sure you clicked Save on Codeforces, wait 5 seconds, and try again!",
        )

    # Unlink from any old account that previously held this handle
    await conn.execute(
        "UPDATE users SET cf_handle = NULL, cf_verified = FALSE WHERE cf_handle = $1 AND id != $2",
        row["cf_handle"], uid,
    )

    # Mark current user as verified owner
    await conn.execute(
        "UPDATE users SET cf_verified = TRUE, verify_code = NULL WHERE id = $1",
        uid,
    )

    logger.info("Handle verified", extra={"user_id": user_id, "handle": row["cf_handle"]})
    return {"status": "verified", "handle": row["cf_handle"]}


@router.get("/problem-statement/{contest_id}/{index}")
async def get_statement_endpoint(contest_id: int, index: str):
    """
    Scrape and return full problem statement HTML via server-side scraper.
    Bypasses client-side CORS and Mixed Content restrictions.
    """
    from app.services.cf_service import get_problem_statement
    data = await get_problem_statement(contest_id, index)
    if not data or not data.get("html"):
        raise HTTPException(404, f"Problem statement HTML unavailable for {contest_id}{index}")
    return data





