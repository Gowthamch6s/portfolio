import Reveal from './Reveal.jsx';

const PROJECTS = [
  {
    title: 'AgentFlow Studio — Autonomous AI Agent System',
    blurb:
      'A self-correcting 5-node LangGraph state machine (plan → execute → sandbox → evaluate → report) with human-in-the-loop approval checkpoints on LangGraph’s interrupt() — durably resuming from the exact paused step, even after a process restart. All LLM-generated code runs isolated in per-thread E2B sandboxes with enforced timeouts, streamed end-to-end via FastAPI SSE to a Next.js dashboard.',
    tech: ['LangGraph', 'FastAPI', 'PostgreSQL', 'E2B', 'Next.js', 'Docker'],
    stat: 'Human-in-the-loop · self-correcting',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #6366f1, #4338ca 60%, #1e1b4b)',
    link: 'https://github.com/Gowthamch6s/AgentFlow-Studio',
    linkLabel: 'View on GitHub →',
    secondaryLink: 'https://github.com/Gowthamch6s/agent-observability-kit',
    secondaryLabel: 'Built agent-observability-kit ↗',
  },
  {
    title: 'LLM Technical Document Validation Assistant',
    blurb:
      'Fully offline AI summarization for confidential specs — a map-reduce pipeline feeding locally-hosted Llama 3 through LangChain. Sub-8-second summaries on 500+ page documents, 91% user-rated quality, zero data leaving the org.',
    tech: ['Python', 'LangChain', 'Llama 3', 'Ollama', 'Gradio'],
    stat: '91% summary quality · 500+ pages',
    emoji: '📄',
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5 60%, #1e1b4b)',
    link: 'https://github.com/Gowthamch6s/ai-assistant',
    linkLabel: 'View on GitHub →',
  },
  {
    title: 'AI Career Copilot — Agentic RAG System',
    blurb:
      'A multi-step LangGraph agent: retrieve live job postings (Adzuna API) → match role via embedding similarity → ground analysis in retrieved job text (FAISS) → generate → self-critique → conditionally regenerate. An independent MLflow-tracked LLM-judge pass — separate from the graph’s own in-graph critique — catches regressions a self-graded agent would miss.',
    tech: ['LangGraph', 'FastAPI', 'FAISS', 'Groq', 'React', 'Adzuna API'],
    stat: '100% eval pass · 1.0 avg faithfulness',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0891b2 60%, #164e63)',
    link: 'https://gowtham00007-ai-career-coach.hf.space',
    linkLabel: 'Live demo →',
  },
  {
    title: 'AI/ML Visual Defect Inspection System',
    blurb:
      'CNN defect classifier for casting-product images at 96.4% accuracy across PASS/FAIL/REVIEW — compressed 91.7% with TensorFlow Lite (127.87 MB → 10.66 MB) for sub-100ms CPU inference, served via FastAPI with a monitoring dashboard.',
    tech: ['TensorFlow', 'Keras', 'FastAPI', 'TFLite'],
    stat: '96.4% accuracy · <100ms inference',
    emoji: '🏭',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626 60%, #7c2d12)',
    link: 'https://github.com/Gowthamch6s/ai-ml-inspection-system',
    linkLabel: 'View on GitHub →',
  },
  {
    title: 'Autonomous Market Intelligence & Startup Validator',
    blurb:
      'A cyclic multi-agent LangGraph pipeline: parallel Scout agents gather live competitor and community-sentiment data via Tavily search, a Gap-Analysis critic loops the research back for another pass via conditional edges until it clears a sufficiency bar (capped by a max-iteration safety limit), then a Synthesis agent compiles a citation-backed Markdown feasibility report — every LLM call schema-validated with Pydantic structured output.',
    tech: ['LangGraph', 'Tavily', 'Streamlit', 'Pydantic', 'Python'],
    stat: 'Cyclic graph · self-critiquing research loop',
    emoji: '🧭',
    gradient: 'linear-gradient(135deg, #10b981, #059669 60%, #064e3b)',
    link: 'https://github.com/Gowthamch6s/market-research-agent',
    linkLabel: 'View on GitHub →',
  },
];

export default function Projects() {
  return (
    <section id="projects" className="relative py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            <span className="gradient-text">03.</span> AI / ML Projects
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              {/* postcard stack — a slightly rotated card peeking out behind,
                  echoing the reference site's stacked-photo treatment */}
              <div className="relative">
                <div
                  className="hidden sm:block absolute inset-0 rounded-3xl -rotate-2 translate-x-2 translate-y-2"
                  style={{ background: p.gradient, opacity: 0.35 }}
                  aria-hidden="true"
                />
                <article className="glass glass-hover rounded-3xl overflow-hidden h-full flex flex-col relative">
                  {/* photo-frame mat — a thick cream border around the
                      "postcard" image, matching the reference site's framed
                      illustration + caption-strip treatment */}
                  <div className="p-2.5" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-40 grid place-items-center text-6xl relative overflow-hidden rounded-xl"
                      style={{ background: p.gradient }}
                      aria-hidden="true"
                    >
                      <span className="drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">{p.emoji}</span>
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 45%)',
                        }}
                      />
                    </div>
                    <p
                      className="mt-2 px-1 text-[11px] font-semibold tracking-wide"
                      style={{ color: 'var(--text-muted)', fontFamily: "'Courier Prime', monospace" }}
                    >
                      {p.stat}
                    </p>
                  </div>

                <div className="p-7 pt-4 flex flex-col grow">
                  <h3 className="text-xl font-bold tracking-tight leading-snug">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed grow" style={{ color: 'var(--text-muted)' }}>
                    {p.blurb}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="skill-chip rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold gradient-text w-fit"
                    >
                      {p.linkLabel || 'View →'}
                    </a>
                  )}
                  {p.secondaryLink && (
                    <a
                      href={p.secondaryLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold w-fit"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {p.secondaryLabel || 'Related repo ↗'}
                    </a>
                  )}
                </div>
                </article>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
