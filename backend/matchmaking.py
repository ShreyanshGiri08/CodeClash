import random
import httpx
import asyncio

# Simple in-memory queue: list of dicts {user_id, elo, joined_at}
queue = []
queue_lock = asyncio.Lock()

async def get_random_problem(target_rating: int) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://codeforces.com/api/problemset.problems")
        data = resp.json()
        problems = data["result"]["problems"]

    # rating ke ±100 range mein filter karo
    candidates = [p for p in problems if p.get("rating") and abs(p["rating"] - target_rating) <= 100]
    if not candidates:
        candidates = [p for p in problems if p.get("rating")]  # fallback: koi bhi rated problem

    chosen = random.choice(candidates)
    return {"contestId": chosen["contestId"], "index": chosen["index"], "rating": chosen.get("rating")}


async def try_match(user_id: str, elo: int):
    async with queue_lock:
        # koi compatible opponent dhoondo
        for i, entry in enumerate(queue):
            if abs(entry["elo"] - elo) <= 200:
                opponent = queue.pop(i)
                return opponent  # match mil gaya
        # koi nahi mila, khud ko queue mein daal do
        queue.append({"user_id": user_id, "elo": elo})
        return None