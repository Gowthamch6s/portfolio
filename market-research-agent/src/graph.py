from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Send

from .agents.critique import critique
from .agents.scout import scout_community, scout_competitors
from .agents.synthesis import synthesize
from .state import MarketResearchState


def route_after_critique(state: MarketResearchState):
    """Conditional edge: the cyclic heart of the graph.

    If the critic judged the research sufficient, or we've hit the
    max_iterations safety limit, proceed to synthesis. Otherwise fan back
    out to both scout agents in parallel for another research loop, using
    Send() so each branch carries the freshly updated state (including the
    critic's follow_up_queries).
    """
    hit_limit = state.get("research_iterations", 0) >= state.get("max_iterations", 2)
    if state.get("research_sufficient") or hit_limit:
        return "synthesize"
    return [Send("scout_competitors", state), Send("scout_community", state)]


def build_graph() -> CompiledStateGraph:
    graph = StateGraph(MarketResearchState)

    graph.add_node("scout_competitors", scout_competitors)
    graph.add_node("scout_community", scout_community)
    graph.add_node("critique", critique)
    graph.add_node("synthesize", synthesize)

    # Initial fan-out: both scouts run in parallel, then join at "critique".
    # The `competitors` / `community_sentiment` / `raw_sources` reducers in
    # MarketResearchState let both branches write back without clobbering
    # each other, and let repeated loops accumulate rather than overwrite.
    graph.add_edge(START, "scout_competitors")
    graph.add_edge(START, "scout_community")
    graph.add_edge("scout_competitors", "critique")
    graph.add_edge("scout_community", "critique")

    graph.add_conditional_edges(
        "critique",
        route_after_critique,
        {"synthesize": "synthesize", "scout_competitors": "scout_competitors", "scout_community": "scout_community"},
    )

    graph.add_edge("synthesize", END)

    return graph.compile()
