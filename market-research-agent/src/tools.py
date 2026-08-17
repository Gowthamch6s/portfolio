import os
from typing import Dict, List, Optional

from tavily import TavilyClient

_client: Optional[TavilyClient] = None


def get_client() -> TavilyClient:
    global _client
    if _client is None:
        api_key = os.environ.get("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY is not set. Add it to your .env file.")
        _client = TavilyClient(api_key=api_key)
    return _client


def web_search(query: str, max_results: int = 5, search_depth: str = "advanced") -> List[Dict]:
    client = get_client()
    response = client.search(query=query, max_results=max_results, search_depth=search_depth)
    return response.get("results", [])


def format_results_for_prompt(results: List[Dict]) -> str:
    if not results:
        return "No results found."
    blocks = [
        f"Title: {r.get('title')}\nURL: {r.get('url')}\nContent: {r.get('content')}"
        for r in results
    ]
    return "\n\n".join(blocks)
