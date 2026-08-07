import httpx

CF_API_BASE = "https://codeforces.com/api"

async def get_cf_user_info(handle: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{CF_API_BASE}/user.info", params={"handles": handle})
        data = resp.json()
        if data["status"] != "OK":
            return None
        return data["result"][0]

async def get_cf_submissions(handle: str, count: int = 10) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": count})
        data = resp.json()
        if data["status"] != "OK":
            return []
        return data["result"]
    
async def check_verdict(handle: str, contest_id: int, index: str, after_timestamp: int):
    """Check karo agar handle ne is problem ka AC submission kiya hai race-start ke baad"""
    submissions = await get_cf_submissions(handle, count=20)
    for sub in submissions:
        if (sub["problem"]["contestId"] == contest_id
            and sub["problem"]["index"] == index
            and sub["creationTimeSeconds"] >= after_timestamp
            and sub["verdict"] == "OK"):
            return True
    return False