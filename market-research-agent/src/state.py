import operator
from typing import Annotated, List, TypedDict


class MarketResearchState(TypedDict):
    """Shared state passed between every node in the graph.

    Fields using `Annotated[..., operator.add]` are reducers: when multiple
    nodes (e.g. the parallel scout agents, or a second research loop) return
    a value for that key, LangGraph appends the new list onto the existing
    one instead of overwriting it. Plain fields are simple overwrites — only
    the most recent value survives.
    """

    startup_idea: str
    target_market: str

    competitors: Annotated[List[dict], operator.add]
    community_sentiment: Annotated[List[str], operator.add]
    raw_sources: Annotated[List[dict], operator.add]
    search_queries_used: Annotated[List[str], operator.add]

    pending_queries: List[str]
    research_iterations: int
    max_iterations: int
    research_sufficient: bool
    gap_analysis_notes: str

    feasibility_analysis: str
    final_report: str
