"""
Codeforces API client and problem scraper.

Uses the public Codeforces API (no key required) for:
  - user.info: checking handle existence and verification code in profile
  - user.status: checking recent submissions for verdict
  - problemset.problems: fetching the full problem list for matchmaking

Problem statement scraping:
  CF doesn't provide an API for problem statements, so we scrape the HTML
  directly from the problem page. Results are cached server-side with a
  configurable TTL to avoid hammering Codeforces on every page load.
"""

import re
import httpx
import logging
from bs4 import BeautifulSoup
from app.services.cache import problem_cache, problemset_cache
from app.config import get_settings


logger = logging.getLogger("codeclash.codeforces")

CF_API_BASE = "https://codeforces.com/api"
CF_PROBLEM_URL = "https://codeforces.com/problemset/problem"


async def get_cf_user_info(handle: str) -> dict | None:
    """
    Fetch user info from Codeforces API.
    Returns the user object or None if handle not found.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{CF_API_BASE}/user.info", params={"handles": handle})
            data = resp.json()
            if data.get("status") != "OK":
                return None
            return data["result"][0]
    except Exception as e:
        logger.error("CF user.info failed", extra={"handle": handle, "error": str(e)})
        return None


async def get_cf_submissions(handle: str, count: int = 20) -> list:
    """
    Fetch recent submissions for a user.
    Returns a list of submission objects or empty list on error.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{CF_API_BASE}/user.status",
                params={"handle": handle, "from": 1, "count": count},
            )
            data = resp.json()
            if data.get("status") != "OK":
                return []
            return data["result"]
    except Exception as e:
        logger.error("CF user.status failed", extra={"handle": handle, "error": str(e)})
        return []


async def get_ac_timestamp(handle: str, contest_id: int, index: str, after_timestamp: int) -> int | None:
    """
    Check if a user has an Accepted verdict on a specific problem submitted
    after race start, returning the earliest AC submission timestamp (creationTimeSeconds).
    Returns None if no AC submission exists.
    """
    submissions = await get_cf_submissions(handle, count=30)
    ac_times = []
    for sub in submissions:
        if (
            sub.get("problem", {}).get("contestId") == contest_id
            and sub.get("problem", {}).get("index") == index
            and sub.get("creationTimeSeconds", 0) >= after_timestamp
            and sub.get("verdict") == "OK"
        ):
            ac_times.append(sub.get("creationTimeSeconds"))
    
    if ac_times:
        earliest_ac = min(ac_times)
        logger.info("AC found with timestamp", extra={"handle": handle, "problem": f"{contest_id}{index}", "ts": earliest_ac})
        return earliest_ac
    return None


async def check_verdict(handle: str, contest_id: int, index: str, after_timestamp: int) -> bool:
    """
    Check if a user has an Accepted verdict on a specific problem
    submitted after the race start timestamp.
    """
    ts = await get_ac_timestamp(handle, contest_id, index, after_timestamp)
    return ts is not None



async def get_all_submissions_verdicts(handle: str, contest_id: int, index: str, after_timestamp: int) -> list[dict]:
    """
    Return all submissions for a specific problem after race start.
    Used to show verdict history in the race room.
    """
    submissions = await get_cf_submissions(handle, count=30)
    results = []
    for sub in submissions:
        if (
            sub.get("problem", {}).get("contestId") == contest_id
            and sub.get("problem", {}).get("index") == index
            and sub.get("creationTimeSeconds", 0) >= after_timestamp
        ):
            results.append({
                "id": sub.get("id"),
                "verdict": sub.get("verdict", "UNKNOWN"),
                "time": sub.get("creationTimeSeconds"),
                "language": sub.get("programmingLanguage", ""),
            })
    return results


import urllib.parse

async def get_problem_statement(contest_id: int, index: str) -> dict:
    """
    Scrape the full problem statement from Codeforces using proxies & multi-selector parsing.
    """
    settings = get_settings()
    cache_key = f"{contest_id}{index}"

    # Check cache first (only valid scraped statements are cached)
    cached = problem_cache.get(cache_key)
    if cached is not None and cached.get("is_valid") is True:
        return cached
    elif cached is not None:
        problem_cache.delete(cache_key)

    cf_url = f"https://codeforces.com/contest/{contest_id}/problem/{index}"
    problemset_url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"

    encoded_cf_url = urllib.parse.quote(cf_url, safe="")
    encoded_ps_url = urllib.parse.quote(problemset_url, safe="")

    urls_to_try = [
        f"https://m.codeforces.com/problemset/problem/{contest_id}/{index}",
        f"https://m.codeforces.com/contest/{contest_id}/problem/{index}",
        f"https://r.jina.ai/{cf_url}",
        f"https://api.allorigins.win/get?url={encoded_cf_url}",
        f"https://api.codetabs.com/v1/proxy?quest={encoded_cf_url}",
        cf_url,
    ]



    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }

    statement_div = None

    for target_url in urls_to_try:
        try:
            logger.info("Attempting to fetch problem statement", extra={"url": target_url})
            async with httpx.AsyncClient(headers=headers, timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(target_url)
                if resp.status_code == 200:
                    html_text = ""
                    if "allorigins.win" in target_url:
                        try:
                            data = resp.json()
                            html_text = data.get("contents", "")
                        except Exception:
                            html_text = resp.text
                    else:
                        html_text = resp.text

                    if html_text:
                        soup = BeautifulSoup(html_text, "html.parser")
                        found = (
                            soup.find("div", class_="problem-statement") or
                            soup.find("div", class_="problemstatement") or
                            soup.find("div", class_="ttypography") or
                            soup.find("div", id="pageContent")
                        )
                        if found:
                            statement_div = found
                            logger.info(f"Successfully scraped problem-statement via {target_url}")
                            break
        except Exception as e:
            logger.warning(f"Problem fetch attempt failed for {target_url}: {e}")



    if not statement_div:
        logger.warning(f"problem-statement div not found for {contest_id}{index}")
        # Return fallback WITHOUT caching — next request will retry scraping
        return {"title": f"Problem {contest_id}{index}", "html": None, "url": cf_url, "is_valid": False}

    # Fix relative image URLs (e.g. /predownloaded/... -> https://codeforces.com/predownloaded/...)
    for img in statement_div.find_all("img"):
        if img.get("src") and img["src"].startswith("/"):
            img["src"] = "https://codeforces.com" + img["src"]

    # Remove duplicate header element inside statement_div (title, constraints)
    header_el = statement_div.find("div", class_="header")
    if header_el:
        header_el.decompose()

    # Clean Codeforces $$$ TeX math delimiters & LaTeX symbols
    raw_html = str(statement_div)
    cleaned_html = (
        raw_html.replace(r"\gt", ">")
        .replace(r"\lt", "<")
        .replace(r"\ge", "≥")
        .replace(r"\le", "≤")
        .replace(r"\dots", "...")
        .replace(r"\cdot", "·")
        .replace(r"\ne", "≠")
        .replace(r"\times", "×")
        .replace(r"\to", "→")
    )
    cleaned_html = re.sub(r'\\color\{[^}]*\}', '', cleaned_html)
    cleaned_html = re.sub(r'\\texttt\{([^}]*)\}', r'\1', cleaned_html)
    cleaned_html = re.sub(r'\\text\{([^}]*)\}', r'\1', cleaned_html)
    cleaned_html = re.sub(
        r'\$\$\$(.*?)\$\$\$',
        r'<code class="font-mono text-accent bg-accent/15 border border-accent/40 px-1.5 py-0.5 rounded text-xs font-bold">\1</code>',
        cleaned_html
    )
    cleaned_html = re.sub(
        r'\$\$(.*?)\$\$',
        r'<code class="font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded text-xs font-bold">\1</code>',
        cleaned_html
    )
    cleaned_html = re.sub(
        r'\$(.*?)\$',
        r'<code class="font-mono text-accent bg-accent/10 border border-accent/20 px-1 py-0.5 rounded text-xs">\1</code>',
        cleaned_html
    )


    title_el = statement_div.find("div", class_="title")
    title = title_el.text.strip() if title_el else f"Problem {contest_id}{index}"

    result = {
        "title": title,
        "html": cleaned_html,
        "url": cf_url,
        "contest_id": contest_id,
        "index": index,
        "is_valid": True,
    }

    # Cache only valid scraped results
    problem_cache.set(cache_key, result, ttl=settings.PROBLEM_CACHE_TTL)
    return result





async def get_random_problem(target_rating: int, tags: list[str] | None = None) -> dict:
    """
    Pick a random problem near the target rating matching optional tags.

    The full CF problemset (~10k problems) is cached for 10 minutes
    to avoid fetching it on every match.
    """
    import random
    settings = get_settings()

    # Check problemset cache
    cached_problems = problemset_cache.get("all_problems")

    if cached_problems is None:
        logger.info("Fetching CF problemset (not cached)")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"{CF_API_BASE}/problemset.problems")
                data = resp.json()
                cached_problems = data["result"]["problems"]
                problemset_cache.set("all_problems", cached_problems, ttl=settings.PROBLEMSET_CACHE_TTL)
        except Exception as e:
            logger.error("Failed to fetch problemset", extra={"error": str(e)})
            raise

    # Clean requested tags
    clean_tags = [t.lower().strip() for t in tags] if tags else []

    # Filter by rating (±150 of target) and tags if specified
    candidates = [
        p for p in cached_problems
        if p.get("rating") and abs(p["rating"] - target_rating) <= 150
        and (not clean_tags or any(ct in [pt.lower() for pt in p.get("tags", [])] for ct in clean_tags))
    ]

    if not candidates and clean_tags:
        # Relax rating constraint to ±300 if tags specified
        candidates = [
            p for p in cached_problems
            if p.get("rating") and abs(p["rating"] - target_rating) <= 300
            and any(ct in [pt.lower() for pt in p.get("tags", [])] for ct in clean_tags)
        ]

    if not candidates:
        # Fallback: any rated problem near target rating
        candidates = [
            p for p in cached_problems
            if p.get("rating") and abs(p["rating"] - target_rating) <= 200
        ]

    if not candidates:
        candidates = [p for p in cached_problems if p.get("rating")]

    selected = random.choice(candidates)
    logger.info("Selected problem", extra={
        "contestId": selected["contestId"],
        "index": selected["index"],
        "rating": selected.get("rating"),
        "tags": selected.get("tags"),
    })
    return selected
