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

from bs4 import BeautifulSoup

_problem_cache = {}

async def get_problem_statement(contest_id: int, index: str) -> dict:
    cache_key = f"{contest_id}{index}"
    if cache_key in _problem_cache:
        return _problem_cache[cache_key]

    url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}) as client:
        resp = await client.get(url)
        soup = BeautifulSoup(resp.text, "html.parser")

    statement_div = soup.find("div", class_="problem-statement")
    if not statement_div:
        return {"title": f"{contest_id}{index}", "html": "", "url": url}

    title_el = statement_div.find("div", class_="title")
    title = title_el.text.strip() if title_el else f"{contest_id}{index}"

    result = {"title": title, "html": str(statement_div), "url": url}
    _problem_cache[cache_key] = result  # cache — CF servers pe baar-baar load nahi karna
    return result

import re

def parse_submission_link(link: str):
    match = re.search(r"(?:contest|problemset)/(\d+)/submission/(\d+)", link)
    if not match:
        return None
    return match.group(1), match.group(2)  # contest_id, submission_id


async def get_submission_by_id(handle: str, submission_id: str):
    subs = await get_cf_submissions(handle, count=50)
    for sub in subs:
        if str(sub["id"]) == str(submission_id):
            return sub
    return None