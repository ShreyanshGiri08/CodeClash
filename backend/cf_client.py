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

def parse_jina_markdown_to_html(md_text: str) -> str:
    if not md_text or "Markdown Content:" not in md_text:
        return None

    content_start = md_text.find("Markdown Content:")
    content = md_text[content_start + len("Markdown Content:"):].strip()

    lines = content.split("\n")
    html_out = ['<div class="problem-statement">']
    in_code_block = False
    code_block_lines = []

    for line in lines:
        stripped = line.strip()

        # Filter out Codeforces website navigation header, logo & flags
        if (
            "[![" in stripped
            or "codeforces-sponsored-by" in stripped
            or "Loading [MathJax]" in stripped
            or "[Enter](" in stripped
            or "[Register]" in stripped
            or stripped.startswith("* [Home]")
            or stripped.startswith("* [Top]")
            or stripped.startswith("* [Catalog]")
            or stripped.startswith("* [Contests]")
            or stripped.startswith("* [Gym]")
            or stripped.startswith("* [Problemset]")
            or stripped.startswith("* [Group]")
            or stripped.startswith("* [Rating]")
            or stripped.startswith("* [API]")
            or stripped.startswith("* [Calendar]")
            or stripped.startswith("Title:")
            or stripped.startswith("URL Source:")
            or stripped == "---"
        ):
            continue

        if stripped.startswith("```"):
            if in_code_block:
                code_content = "\n".join(code_block_lines)
                html_out.append(f'<pre class="sample-test-box bg-[#0d0d15] p-3 rounded-lg border border-accent/30 font-mono text-xs my-2 overflow-x-auto"><code>{code_content}</code></pre>')
                code_block_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_block_lines.append(line)
            continue

        if stripped == "Input":
            html_out.append('<div class="section-title text-accent font-bold text-sm mt-4 mb-2">Input</div>')
        elif stripped == "Output":
            html_out.append('<div class="section-title text-accent font-bold text-sm mt-4 mb-2">Output</div>')
        elif stripped in ("Example", "Examples"):
            html_out.append('<div class="section-title text-accent font-bold text-sm mt-4 mb-2">Examples</div>')
        elif stripped == "Note":
            html_out.append('<div class="section-title text-accent font-bold text-sm mt-4 mb-2">Note</div>')
        elif stripped == "Copy":
            continue
        elif stripped:
            html_out.append(f'<p class="mb-3 text-sm leading-relaxed">{line}</p>')

    html_out.append('</div>')
    return "".join(html_out)



async def get_problem_statement(contest_id: int, index: str) -> dict:
    cache_key = f"{contest_id}{index}"
    if cache_key in _problem_cache:
        return _problem_cache[cache_key]

    cf_url = f"https://codeforces.com/contest/{contest_id}/problem/{index}?locale=en"
    problemset_url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}?locale=en"
    encoded_url = urllib.parse.quote(cf_url, safe="")

    urls_to_try = [
        f"https://r.jina.ai/{cf_url}",
        f"https://r.jina.ai/{problemset_url}",
        f"https://api.allorigins.win/get?url={encoded_url}",
        f"https://api.codetabs.com/v1/proxy?quest={encoded_url}",
        cf_url,
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    }

    statement_div = None
    async with httpx.AsyncClient(headers=headers, timeout=12.0, follow_redirects=True) as client:
        for target_url in urls_to_try:
            try:
                resp = await client.get(target_url)
                if resp.status_code == 200 and resp.text:
                    html_text = resp.text
                    if "r.jina.ai" in target_url and "Markdown Content:" in html_text:
                        parsed_jina = parse_jina_markdown_to_html(html_text)
                        if parsed_jina:
                            statement_div = BeautifulSoup(parsed_jina, "html.parser")
                            break

                    soup = BeautifulSoup(html_text, "html.parser")
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