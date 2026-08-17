from langchain_core.messages import HumanMessage, SystemMessage

from ..llm import get_llm
from ..schemas import FeasibilityReport
from ..state import MarketResearchState

SYNTHESIS_SYSTEM = """You are the Chief Analyst compiling a startup feasibility report from verified research.
Write clear, structured Markdown with these sections: Executive Summary, Market Landscape, Competitor
Breakdown (a table if useful), Community Sentiment, Feasibility Verdict (a clear Go / Caution / No-Go
call), and Recommended Next Steps. Cite claims inline using the source titles provided, e.g.
(Source: <title>). Do not fabricate facts, companies, or URLs beyond what is given to you."""


def synthesize(state: MarketResearchState) -> dict:
    structured_llm = get_llm().with_structured_output(FeasibilityReport)
    report: FeasibilityReport = structured_llm.invoke(
        [
            SystemMessage(content=SYNTHESIS_SYSTEM),
            HumanMessage(
                content=(
                    f"Startup idea: {state['startup_idea']}\n"
                    f"Target market: {state.get('target_market', 'unspecified')}\n"
                    f"Competitors: {state.get('competitors', [])}\n"
                    f"Community sentiment: {state.get('community_sentiment', [])}\n"
                    f"Gap-analysis notes: {state.get('gap_analysis_notes', '')}\n"
                    f"Research loops run: {state.get('research_iterations', 0)}"
                )
            ),
        ]
    )

    seen_urls: set[str] = set()
    reference_lines = ["\n## Sources\n"]
    for source in state.get("raw_sources", []):
        url = source.get("url")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        reference_lines.append(f"- [{source.get('title') or url}]({url})")

    final_markdown = report.final_report + "\n" + "\n".join(reference_lines)

    return {
        "feasibility_analysis": report.feasibility_analysis,
        "final_report": final_markdown,
    }
