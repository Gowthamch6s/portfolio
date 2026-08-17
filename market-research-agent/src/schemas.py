from typing import List, Optional

from pydantic import BaseModel, Field


class Competitor(BaseModel):
    name: str
    url: Optional[str] = Field(default=None, description="Must come from the provided search results, never invented")
    description: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)


class CompetitorFindings(BaseModel):
    competitors: List[Competitor]


class SentimentFindings(BaseModel):
    community_sentiment: List[str] = Field(
        description="Short, paraphrased insights from forums/reviews/communities, each noting its source"
    )


class GapAnalysis(BaseModel):
    sufficient: bool = Field(description="True if gathered research is enough to write a credible feasibility report")
    reasoning: str
    follow_up_queries: List[str] = Field(
        default_factory=list,
        description="1-3 specific search queries to close the gaps. Only populate if sufficient=False.",
    )


class FeasibilityReport(BaseModel):
    feasibility_analysis: str = Field(description="2-4 paragraph narrative verdict on market feasibility")
    final_report: str = Field(
        description=(
            "Full markdown report with sections: Executive Summary, Market Landscape, "
            "Competitor Breakdown, Community Sentiment, Feasibility Verdict (Go / Caution / No-Go), "
            "and Recommended Next Steps. Cite claims inline as (Source: <title>)."
        )
    )
