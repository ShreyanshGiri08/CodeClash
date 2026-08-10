import httpx
import urllib.parse


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

    cf_url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}?locale=en"
    encoded_url = urllib.parse.quote(cf_url, safe="")
    urls_to_try = [
        f"https://api.allorigins.win/get?url={encoded_url}",
        f"https://m.codeforces.com/problemset/problem/{contest_id}/{index}?locale=en",
        f"https://m.codeforces.com/contest/{contest_id}/problem/{index}?locale=en",
        f"https://r.jina.ai/{cf_url}",
        cf_url,
    ]


    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    }

    statement_div = None
    async with httpx.AsyncClient(headers=headers, timeout=10.0, follow_redirects=True) as client:
        for target_url in urls_to_try:
            try:
                resp = await client.get(target_url)
                if resp.status_code == 200 and resp.text:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    found = (
                        soup.find("div", class_="problem-statement") or
                        soup.find("div", class_="problemstatement") or
                        soup.find("div", class_="ttypography") or
                        soup.find("div", class_="sample-tests")
                    )
                    if found:
                        statement_div = found
                        break
            except Exception:
                continue

    if not statement_div:
        return {"title": f"Problem {contest_id}{index}", "html": "", "url": cf_url}

    title_el = statement_div.find("div", class_="title")
    title = title_el.text.strip() if title_el else f"Problem {contest_id}{index}"

    result = {"title": title, "html": str(statement_div), "url": cf_url}
    _problem_cache[cache_key] = result
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