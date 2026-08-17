from langchain_core.messages import HumanMessage, SystemMessage

from ..llm import get_llm
from ..schemas import CompetitorFindings, SentimentFindings
from ..state import MarketResearchState
from ..tools import format_results_for_prompt, web_search

COMPETITOR_SYSTEM = """You are a Competitive Intelligence Scout for a startup market-research agent.
Given raw web search results, extract real, named competitors relevant to the startup idea and target market.
Only include competitors clearly supported by the search results — never invent a company or URL.
For each one, capture its name, url (taken directly from the search results), a one-sentence description,
and up to 3 strengths and weaknesses inferred conservatively from the content provided.
If the results don't support any competitors, return an empty list."""

COMMUNITY_SYSTEM = """You are a Community Sentiment Scout for a startup market-research agent.
Given raw web search results from forums, review sites, and social discussions, extract short, concrete
insights about how real people talk about this problem space: pain points, complaints about existing
solutions, willingness to pay, or enthusiasm. Paraphrase, don't invent, and note the source title for each
insight, e.g. "Users on r/smallbusiness report X (Source: <title>)". If nothing relevant is found, return
an empty list."""


def _default_competitor_queries(idea: str, market: str) -> list[str]:
    return [
        f"top competitors and alternatives to {idea} in {market}",
        f"{idea} {market} market landscape",
    ]


def _default_community_queries(idea: str, market: str) -> list[str]:
    return [
        f"{idea} reddit reviews complaints",
        f"{market} pain points forum discussion",
    ]


def scout_competitors(state: MarketResearchState) -> dict:
    idea = state["startup_idea"]
    market = state.get("target_market") or "the general market"
    queries = state.get("pending_queries") or _default_competitor_queries(idea, market)

    all_results = []
    used_queries = []
    for query in queries[:3]:
        results = web_search(query, max_results=5)
        all_results.extend(results)
        used_queries.append(query)

    context = format_results_for_prompt(all_results)
    structured_llm = get_llm().with_structured_output(CompetitorFindings)
    findings: CompetitorFindings = structured_llm.invoke(
        [
            SystemMessage(content=COMPETITOR_SYSTEM),
            HumanMessage(
                content=f"Startup idea: {idea}\nTarget market: {market}\n\nSearch results:\n{context}"
            ),
        ]
    )

    sources = [{"title": r.get("title"), "url": r.get("url")} for r in all_results if r.get("url")]

    return {
        "competitors": [c.model_dump() for c in findings.competitors],
        "search_queries_used": used_queries,
        "raw_sources": sources,
    }


def scout_community(state: MarketResearchState) -> dict:
    idea = state["startup_idea"]
    market = state.get("target_market") or "the general market"
    queries = state.get("pending_queries") or _default_community_queries(idea, market)

    all_results = []
    used_queries = []
    for query in queries[:3]:
        results = web_search(query, max_results=5)
        all_results.extend(results)
        used_queries.append(query)

    context = format_results_for_prompt(all_results)
    structured_llm = get_llm().with_structured_output(SentimentFindings)
    findings: SentimentFindings = structured_llm.invoke(
        [
            SystemMessage(content=COMMUNITY_SYSTEM),
            HumanMessage(
                content=f"Startup idea: {idea}\nTarget market: {market}\n\nSearch results:\n{context}"
            ),
        ]
    )

    sources = [{"title": r.get("title"), "url": r.get("url")} for r in all_results if r.get("url")]

    return {
        "community_sentiment": findings.community_sentiment,
        "search_queries_used": used_queries,
        "raw_sources": sources,
    }
