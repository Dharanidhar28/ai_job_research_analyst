import os
import aiohttp

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")


async def search_jobs(query: str, country: str = "us"):
    # If Adzuna keys not set, return a mock response
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return [
            {
                "title": "Mock Job for: " + query,
                "company": "Example Co",
                "location": "Remote",
                "description": "This is a mock job.",
                "redirect_url": "https://example.com",
            }
        ]
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 20,
        "what": query,
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as resp:
            data = await resp.json()
            results = []
            for item in data.get("results", []):
                results.append(
                    {
                        "title": item.get("title"),
                        "company": item.get("company", {}).get("display_name"),
                        "location": item.get("location", {}).get("display_name"),
                        "description": item.get("description"),
                        "redirect_url": item.get("redirect_url") or item.get("url"),
                    }
                )
            return results
