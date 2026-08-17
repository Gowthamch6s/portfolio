from langchain_core.messages import HumanMessage, SystemMessage

from ..llm import get_llm
from ..schemas import GapAnalysis
from ..state import MarketResearchState

CRITIQUE_SYSTEM = """You are the Gap-Analysis critic in a startup market-validation pipeline.
Review the research gathered so far and decide whether it is sufficient to write a credible,
well-cited feasibility report. Be strict: require at least 2 named competitors with real detail,
and at least 2 distinct community-sentiment signals, before declaring sufficiency. If insufficient,
propose 1-3 precise follow-up web search queries that would close the most important gaps — do not
repeat queries already used."""


def critique(state: MarketResearchState) -> dict:
    competitors = state.get("competitors", [])
    sentiment = state.get("community_sentiment", [])
    used_queries = state.get("search_queries_used", [])
    iteration = state.get("research_iterations", 0) + 1

    structured_llm = get_llm().with_structured_output(GapAnalysis)
    analysis: GapAnalysis = structured_llm.invoke(
        [
            SystemMessage(content=CRITIQUE_SYSTEM),
            HumanMessage(
                content=(
                    f"Startup idea: {state['startup_idea']}\n"
                    f"Target market: {state.get('target_market', 'unspecified')}\n"
                    f"Research loop: {iteration}\n"
                    f"Competitors found ({len(competitors)}): {competitors}\n"
                    f"Community sentiment found ({len(sentiment)}): {sentiment}\n"
                    f"Queries already used: {used_queries}"
                )
            ),
        ]
    )

    return {
        "research_iterations": iteration,
        "research_sufficient": analysis.sufficient,
        "gap_analysis_notes": analysis.reasoning,
        "pending_queries": analysis.follow_up_queries,
    }
