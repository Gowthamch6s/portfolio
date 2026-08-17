import os

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

from src.graph import build_graph  # noqa: E402
from src.state import MarketResearchState  # noqa: E402

st.set_page_config(page_title="Market Intelligence & Startup Validator", page_icon="🧭", layout="wide")

st.title("🧭 Autonomous Market Intelligence & Startup Validator")
st.caption(
    "Multi-agent LangGraph pipeline: parallel Scout agents → cyclic Gap-Analysis critique → "
    "Synthesis, backed by live Tavily search."
)

with st.sidebar:
    st.header("Configuration")
    max_iterations = st.slider("Max research loops", 1, 4, 2)
    st.markdown("---")
    st.markdown("Requires `OPENAI_API_KEY` and `TAVILY_API_KEY` in a `.env` file at the project root.")

idea = st.text_area(
    "Startup idea / concept",
    placeholder="e.g. An AI copilot that helps solo landlords screen tenants and draft leases",
    height=100,
)
market = st.text_input("Target market (optional — the agent will treat it as general if left blank)")

run = st.button("Run Market Validation", type="primary", disabled=not idea.strip())

if run:
    missing = [key for key in ("OPENAI_API_KEY", "TAVILY_API_KEY") if not os.environ.get(key)]
    if missing:
        st.error(f"Missing environment variable(s): {', '.join(missing)}. Add them to your .env file and restart.")
        st.stop()

    graph = build_graph()
    initial_state: MarketResearchState = {
        "startup_idea": idea,
        "target_market": market,
        "competitors": [],
        "community_sentiment": [],
        "raw_sources": [],
        "search_queries_used": [],
        "pending_queries": [],
        "research_iterations": 0,
        "max_iterations": max_iterations,
        "research_sufficient": False,
        "gap_analysis_notes": "",
        "feasibility_analysis": "",
        "final_report": "",
    }

    progress = st.status("Starting research pipeline...", expanded=True)
    final_state = None
    try:
        for state_snapshot in graph.stream(
            initial_state, stream_mode="values", config={"recursion_limit": 25}
        ):
            final_state = state_snapshot
            progress.write(
                f"Loop {state_snapshot.get('research_iterations', 0)} — "
                f"{len(state_snapshot.get('competitors', []))} competitors, "
                f"{len(state_snapshot.get('community_sentiment', []))} sentiment signals gathered"
            )
        progress.update(label="Research pipeline complete", state="complete")
    except Exception as exc:  # surfaces API/key errors clearly in the UI
        progress.update(label="Pipeline failed", state="error")
        st.exception(exc)
        st.stop()

    if final_state and final_state.get("final_report"):
        st.subheader("Feasibility Verdict")
        st.info(final_state["feasibility_analysis"])

        st.subheader("Full Report")
        st.markdown(final_state["final_report"])

        st.download_button(
            "Download report (.md)",
            final_state["final_report"],
            file_name="market_validation_report.md",
            mime="text/markdown",
        )

        with st.expander("Gap-analysis notes & raw research data"):
            st.write(f"**Research loops run:** {final_state.get('research_iterations', 0)}")
            st.write(f"**Critic's last verdict:** {final_state.get('gap_analysis_notes', '')}")
            st.json(
                {
                    "competitors": final_state.get("competitors", []),
                    "community_sentiment": final_state.get("community_sentiment", []),
                }
            )
    else:
        st.warning("No report was generated.")
