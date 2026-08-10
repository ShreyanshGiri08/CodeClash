import asyncio
import httpx
from bs4 import BeautifulSoup
import json

async def main():
    print("--- Testing Codeforces API ---")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test 1: Fetch problemset
        resp = await client.get("https://codeforces.com/api/problemset.problems")
        print("API Status:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            problems = data.get("result", {}).get("problems", [])
            print(f"Fetched {len(problems)} problems from Codeforces API!")
            if problems:
                print("Sample problem 0:", problems[0])

        # Test 2: Fetch Problem 1362B HTML
        print("\n--- Testing Problem 1362B HTML Scraping ---")
        urls = [
            "https://codeforces.com/problemset/problem/1362/B",
            "https://m.codeforces.com/problemset/problem/1362/B",
            "https://api.allorigins.win/get?url=https%3A%2F%2Fcodeforces.com%2Fproblemset%2Fproblem%2F1362%2FB"
        ]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        for u in urls:
            try:
                r = await client.get(u, headers=headers)
                print(f"URL: {u} -> Status: {r.status_code}, Length: {len(r.text)}")
                text = r.text
                if "allorigins" in u:
                    try:
                        text = r.json().get("contents", "")
                    except:
                        pass
                soup = BeautifulSoup(text, "html.parser")
                div = soup.find("div", class_="problem-statement") or soup.find("div", class_="ttypography")
                if div:
                    print(f"SUCCESS! Found div for {u}, len={len(str(div))}")
                else:
                    print(f"FAIL: No div found for {u}")
            except Exception as e:
                print(f"Error fetching {u}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
