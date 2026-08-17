# Autonomous Market Intelligence & Startup Validator

A stateful, multi-agent market-research engine. Give it a startup idea and it orchestrates
specialized worker agents over a cyclic LangGraph state machine to gather live web and
community data, critique its own research for gaps, and compile a structured,
citation-backed Markdown feasibility report.

## Architecture

```
                ┌─────────────────────┐
        ┌──────▶│  scout_competitors   │──┐
        │       └─────────────────────┘  │
   START┤                                 ▼
        │       ┌─────────────────────┐  ┌───────────┐        ┌────────────┐
        └──────▶│   scout_community    │─▶│  critique │──────▶│  synthesize │──▶ END
                └─────────────────────┘  └─────┬─────┘        └────────────┘
                        ▲                       │
                        │   insufficient +      │
                        └── under max_iterations┘
```

- **Scout agents** (`src/agents/scout.py`) run in parallel from `START`, each calling the
  Tavily search API and parsing raw results into structured Pydantic objects
  (`Competitor`, sentiment insights) via `.with_structured_output()`.
- **Critique agent** (`src/agents/critique.py`) is the gap-analysis node: it inspects the
  research gathered so far and decides, via a conditional edge, whether to loop back to the
  scouts with new follow-up queries or hand off to synthesis. This loop is capped by
  `max_iterations` as a safety limit regardless of the critic's verdict.
- **Synthesis agent** (`src/agents/synthesis.py`) compiles the final Markdown report and
  appends a deduplicated, deterministically-built Sources section (never trusting the LLM to
  invent URLs).

### Key LangGraph concepts in play

- **State reducers** — `MarketResearchState` (`src/state.py`) uses
  `Annotated[List[...], operator.add]` on `competitors`, `community_sentiment`,
  `raw_sources`, and `search_queries_used` so that both parallel scout branches, and
  successive research loops, *accumulate* rather than overwrite each other.
- **Cyclic graph / conditional edges** — `route_after_critique` in `src/graph.py` returns
  either `"synthesize"` or a pair of `Send(...)` objects that fan back out to both scouts,
  making the graph loop until the critic is satisfied or the iteration cap is hit.
- **Structured output** — every LLM call in the pipeline is wrapped in
  `.with_structured_output(PydanticModel)` (`src/schemas.py`) to keep the graph's state
  well-typed and prevent malformed JSON from derailing the run.

## Setup

```bash
cd market-research-agent
python -m venv .venv
.venv\Scripts\activate        # on Windows
pip install -r requirements.txt
copy .env.example .env        # then fill in your real keys
```

You'll need:
- `OPENAI_API_KEY` — from https://platform.openai.com
- `TAVILY_API_KEY` — from https://tavily.com

## Run

```bash
streamlit run app.py
```

Enter a startup idea (and optionally a target market), pick how many research loops to
allow, and click **Run Market Validation**. The app streams live progress as each agent
runs, then renders the final feasibility report with a download button.

## Project layout

```
market-research-agent/
├── app.py                  # Streamlit UI
├── requirements.txt
├── .env.example
└── src/
    ├── state.py             # MarketResearchState TypedDict + reducers
    ├── schemas.py            # Pydantic models for structured LLM output
    ├── llm.py                 # Shared ChatOpenAI getter
    ├── tools.py                # Tavily search wrapper
    ├── graph.py                 # StateGraph assembly + conditional routing
    └── agents/
        ├── scout.py              # Competitor + community sentiment scouts
        ├── critique.py            # Gap-analysis / loop-routing agent
        └── synthesis.py            # Final report compiler
```
