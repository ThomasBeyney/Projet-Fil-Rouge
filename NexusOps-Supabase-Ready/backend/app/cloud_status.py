import asyncio
from datetime import datetime, timezone
from time import monotonic

import httpx

SOURCES = {
    "github": ("GitHub", "https://www.githubstatus.com/api/v2/summary.json"),
    "cloudflare": ("Cloudflare", "https://www.cloudflarestatus.com/api/v2/summary.json"),
}

cache = {"expires": 0, "data": None}


async def fetch_provider(client, key, name, url):
    try:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()

        return {
            "id": key,
            "name": name,
            "indicator": data["status"]["indicator"],
            "description": data["status"]["description"],
            "incidents": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "status": item["status"],
                }
                for item in data.get("incidents", [])
            ],
            "affected_count": sum(
                item.get("status") != "operational"
                for item in data.get("components", [])
            ),
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "error": None,
        }

    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        return {
            "id": key,
            "name": name,
            "indicator": "unknown",
            "description": "Source indisponible",
            "incidents": [],
            "affected_count": 0,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "error": "fetch_failed",
        }


async def get_cloud_status():
    if cache["data"] is not None and monotonic() < cache["expires"]:
        return cache["data"]

    async with httpx.AsyncClient(timeout=8) as client:
        results = await asyncio.gather(
            *(
                fetch_provider(client, key, name, url)
                for key, (name, url) in SOURCES.items()
            )
        )

    cache["data"] = results
    cache["expires"] = monotonic() + 60
    return results