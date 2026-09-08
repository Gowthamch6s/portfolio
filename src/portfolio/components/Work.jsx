import Reveal from './Reveal.jsx';
import WorkPoster from './WorkPoster.jsx';

// Projects and experience/education merged into one continuous timeline —
// matching the reference site's "Selected Work" structure (Counterpoint ->
// Facebook -> Able -> Meta all as one flow) instead of two separate
// sections. Ordered by recency/significance, most current first.
const WORK = [
  {
    kind: 'project',
    badge: 'Actively Developed',
    title: 'AgentFlow Studio',
    org: 'Personal Project · Autonomous AI Agent System',
    period: 'Est. 2025',
    blurb:
      'A self-correcting 5-node LangGraph state machine (plan → execute → sandbox → evaluate → report) with human-in-the-loop approval checkpoints on LangGraph’s interrupt() — durably resuming from the exact paused step, even after a process restart. All LLM-generated code runs isolated in per-thread E2B sandboxes with enforced timeouts, streamed end-to-end via FastAPI SSE to a Next.js dashboard.',
    highlights: [
      'Plan → execute → sandbox → evaluate → report, self-correcting on failure',
      'Human-in-the-loop approval via LangGraph interrupt(), resumable across restarts',
      'LLM-generated code sandboxed per-thread in E2B with enforced timeouts',
      'FastAPI SSE streaming end-to-end to a Next.js dashboard',
    ],
    tech: ['LangGraph', 'FastAPI', 'PostgreSQL', 'E2B', 'Next.js', 'Docker'],
    emoji: '🤖',
    scene: 'circuit',
    palette: { sky: ['#2a2560', '#4338ca'], line: '#c7d2fe', glow: '#818cf8' },
    link: 'https://github.com/Gowthamch6s/AgentFlow-Studio',
    linkLabel: 'View on GitHub →',
    secondaryLink: 'https://github.com/Gowthamch6s/agent-observability-kit',
    secondaryLabel: 'Built agent-observability-kit ↗',
  },
  {
    kind: 'experience',
    badge: 'Current Role',
    title: 'Graduate Teaching Assistant — Operating Systems',
    org: 'University of South Florida',
    period: 'Nov 2024 — May 2026',
    blurb:
      "Supporting Prof. Valentina Korzhova's neural-symbolic AI research (2 active faculty publications). Instructing 60+ graduate students per semester in Operating Systems at 92%+ course satisfaction, and automating project grading with Python — cutting turnaround 35%.",
    highlights: [
      'Instructing 60+ grad students/semester at 92%+ course satisfaction',
      'Supporting 2 active faculty publications in neural-symbolic AI research',
      'Automated project grading in Python — cut turnaround 35%',
    ],
    emoji: '🧑‍🏫',
    scene: 'forest',
    palette: { sky: ['#eaf3df', '#a8c98a'], line: '#215732', glow: '#f4d35e' },
  },
  {
    kind: 'project',
    badge: 'Live Demo',
    title: 'AI Career Copilot',
    org: 'Agentic RAG System',
    period: '2025',
    blurb:
      'A multi-step LangGraph agent: retrieve live job postings (Adzuna API) → match role via embedding similarity → ground analysis in retrieved job text (FAISS) → generate → self-critique → conditionally regenerate. An independent MLflow-tracked LLM-judge pass — separate from the graph’s own in-graph critique — catches regressions a self-graded agent would miss.',
    highlights: [
      'Live job retrieval (Adzuna API) matched via embedding similarity',
      'RAG-grounded analysis (FAISS) with self-critique + conditional regeneration',
      'Independent MLflow-tracked LLM-judge pass separate from in-graph critique',
      '100% eval pass rate · 1.0 avg faithfulness score',
    ],
    tech: ['LangGraph', 'FastAPI', 'FAISS', 'Groq', 'React', 'Adzuna API'],
    emoji: '🎯',
    scene: 'wave',
    palette: { sky: ['#dff4fb', '#7dd3e8'], line: '#0b4f6c', glow: '#fef9c3' },
    link: 'https://gowtham00007-ai-career-coach.hf.space',
    linkLabel: 'Live demo →',
  },
  {
    kind: 'project',
    badge: 'Open Source',
    title: 'Autonomous Market Intelligence & Startup Validator',
    org: 'Cyclic Multi-Agent Research System',
    period: '2025',
    blurb:
      'A cyclic multi-agent LangGraph pipeline: parallel Scout agents gather live competitor and community-sentiment data via Tavily search, a Gap-Analysis critic loops the research back for another pass via conditional edges until it clears a sufficiency bar (capped by a max-iteration safety limit), then a Synthesis agent compiles a citation-backed Markdown feasibility report — every LLM call schema-validated with Pydantic structured output.',
    highlights: [
      'Parallel Scout agents gather live competitor + sentiment data (Tavily)',
      'Gap-Analysis critic loops research via conditional edges to a sufficiency bar',
      'Synthesis agent compiles a citation-backed Markdown feasibility report',
      'Every LLM call schema-validated with Pydantic structured output',
    ],
    tech: ['LangGraph', 'Tavily', 'Streamlit', 'Pydantic', 'Python'],
    emoji: '🧭',
    scene: 'canyon',
    palette: { sky: ['#fdeecb', '#f0a868'], line: '#8a3b1f', glow: '#fde68a' },
    link: 'https://github.com/Gowthamch6s/market-research-agent',
    linkLabel: 'View on GitHub →',
  },
  {
    kind: 'project',
    badge: 'Open Source',
    title: 'LLM Technical Document Validation Assistant',
    org: 'Fully Offline Summarization Pipeline',
    period: '2024',
    blurb:
      'Fully offline AI summarization for confidential specs — a map-reduce pipeline feeding locally-hosted Llama 3 through LangChain. Sub-8-second summaries on 500+ page documents, 91% user-rated quality, zero data leaving the org.',
    highlights: [
      'Map-reduce pipeline over locally-hosted Llama 3 — zero data leaves the org',
      'Sub-8-second summaries on 500+ page documents',
      '91% user-rated summary quality',
    ],
    tech: ['Python', 'LangChain', 'Llama 3', 'Ollama', 'Gradio'],
    emoji: '📄',
    scene: 'circuit',
    palette: { sky: ['#2e1f4d', '#6d28d9'], line: '#ddd6fe', glow: '#c4b5fd' },
    link: 'https://github.com/Gowthamch6s/ai-assistant',
    linkLabel: 'View on GitHub →',
  },
  {
    kind: 'project',
    badge: 'Open Source',
    title: 'AI/ML Visual Defect Inspection System',
    org: 'CNN Classifier + Edge Deployment',
    period: '2024',
    blurb:
      'CNN defect classifier for casting-product images at 96.4% accuracy across PASS/FAIL/REVIEW — compressed 91.7% with TensorFlow Lite (127.87 MB → 10.66 MB) for sub-100ms CPU inference, served via FastAPI with a monitoring dashboard.',
    highlights: [
      '96.4% accuracy across PASS / FAIL / REVIEW classes',
      'Compressed 91.7% via TFLite — 127.87 MB → 10.66 MB',
      'Sub-100ms CPU inference, served via FastAPI + monitoring dashboard',
    ],
    tech: ['TensorFlow', 'Keras', 'FastAPI', 'TFLite'],
    emoji: '🏭',
    scene: 'canyon',
    palette: { sky: ['#fde3d0', '#f2734b'], line: '#7c2d12', glow: '#fed7aa' },
    link: 'https://github.com/Gowthamch6s/ai-ml-inspection-system',
    linkLabel: 'View on GitHub →',
  },
  {
    kind: 'experience',
    title: 'Frontend Engineer',
    org: 'Phoenix Global · EdTech startup serving IIT/IIM tutors · Remote',
    period: 'Jun 2022 — May 2024',
    blurb:
      "Started as intern; extended 2 years as the team's sole frontend engineer. Built the company's core tutoring website from the ground up, shipped real-time dashboards for tutor availability and student progress over REST APIs, and led UI/UX direction for a platform used daily by thousands.",
    highlights: [
      'Sole frontend engineer — built the core tutoring site from the ground up',
      'Real-time dashboards for tutor availability + student progress over REST APIs',
      'Led UI/UX direction for a platform used daily by thousands',
    ],
    emoji: '💻',
    scene: 'wave',
    palette: { sky: ['#fde2ef', '#f472b6'], line: '#831843', glow: '#fbcfe8' },
  },
  {
    kind: 'education',
    title: 'MS, Computer Science',
    org: 'University of South Florida · GPA 3.50 / 4.0',
    period: 'Aug 2024 — May 2026',
    blurb: 'Coursework: Machine Learning, NLP, Distributed Systems, Advanced Algorithms.',
    emoji: '🎓',
    scene: 'forest',
    palette: { sky: ['#e7f0da', '#7fa563'], line: '#26301f', glow: '#fef3c7' },
  },
  {
    kind: 'education',
    title: 'B.Tech, Computer Science & Engineering',
    org: 'KL Deemed to be University · GPA 8.57 / 10.0',
    period: 'Aug 2020 — May 2024',
    blurb: 'Coursework: Data Structures, Operating Systems, AI, Database Management.',
    emoji: '🎓',
    scene: 'canyon',
    palette: { sky: ['#f5e6d3', '#c9973f'], line: '#5c3a1e', glow: '#fde68a' },
  },
];

const KIND_LABEL = { project: 'Project', experience: 'Experience', education: 'Education' };

export default function Work() {
  return (
    <section id="projects" className="relative py-24 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="mb-4">
            <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: 'var(--accent-2)' }}>
              Selected Work
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              <span className="gradient-text">03.</span> Projects &amp; Experience
            </h2>
            <p className="hand-accent text-xl mt-2" style={{ color: 'var(--text-muted)' }}>
              visit the projects · stay on the marked path
            </p>
          </div>
        </Reveal>

        <div className="mt-14 flex flex-col gap-20">
          {WORK.map((w, i) => (
            <Reveal key={w.title} delay={Math.min(i * 0.06, 0.3)}>
              <article className="grid md:grid-cols-2 gap-8 items-start">
                {/* text side */}
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="permit-badge rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {KIND_LABEL[w.kind]}
                    </span>
                    {w.badge && (
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                        style={{ background: 'var(--accent)' }}
                      >
                        {w.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl">{w.title}</h3>
                  <p className="font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>
                    {w.org} &middot; {w.period}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {w.blurb}
                  </p>

                  {w.highlights && (
                    <ul className="mt-5 flex flex-col gap-2">
                      {w.highlights.map((h) => (
                        <li key={h} className="flex gap-2.5 text-sm leading-snug">
                          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>
                            &#9670;
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {w.tech && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {w.tech.map((t) => (
                        <span key={t} className="skill-chip rounded-full px-3 py-1 text-xs font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-1.5">
                    {w.link && (
                      <a
                        href={w.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold gradient-text w-fit"
                      >
                        {w.linkLabel || 'View →'}
                      </a>
                    )}
                    {w.secondaryLink && (
                      <a
                        href={w.secondaryLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold w-fit"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {w.secondaryLabel || 'Related repo ↗'}
                      </a>
                    )}
                  </div>
                </div>

                {/* postcard-stack visual side — a flat-vector "travel
                    poster" scene standing in for the reference site's
                    bespoke painted illustration */}
                <div className={`relative ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div
                    className="hidden sm:block absolute inset-0 rounded-3xl rotate-2 translate-x-2 translate-y-2"
                    style={{ background: w.palette.line, opacity: 0.18 }}
                    aria-hidden="true"
                  />
                  <div className="glass rounded-3xl overflow-hidden relative">
                    <div className="p-2.5" style={{ background: 'var(--bg)' }}>
                      <div className="h-44 relative overflow-hidden rounded-xl">
                        <WorkPoster title={w.title} scene={w.scene} palette={w.palette} />
                        <span
                          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full grid place-items-center text-lg shadow-lg"
                          style={{ background: w.palette.sky[1] }}
                          aria-hidden="true"
                        >
                          {w.emoji}
                        </span>
                      </div>
                      <p
                        className="mt-2 px-1 text-[11px] font-semibold tracking-wide"
                        style={{ color: 'var(--text-muted)', fontFamily: "'Courier Prime', monospace" }}
                      >
                        {w.period} &middot; {w.org}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
