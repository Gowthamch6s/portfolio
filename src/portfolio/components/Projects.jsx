import Reveal from './Reveal.jsx';

const PROJECTS = [
  {
    title: 'LLM Technical Document Validation Assistant',
    blurb:
      'Fully offline AI summarization for confidential specs — a map-reduce pipeline feeding locally-hosted Llama 3 through LangChain. Sub-8-second summaries on 500+ page documents, 91% user-rated quality, zero data leaving the org.',
    tech: ['Python', 'LangChain', 'Llama 3', 'Ollama', 'Gradio'],
    stat: '91% summary quality · 500+ pages',
    emoji: '📄',
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5 60%, #1e1b4b)',
  },
  {
    title: 'AI Career Copilot — Agentic RAG System',
    blurb:
      'A LangGraph agent that retrieves live job postings, grounds a gap analysis in the actual resume and job text, then grades its own output on faithfulness/specificity/relevance and automatically retries if it fails its own bar. Backed by a reproducible offline eval suite, not just an asserted quality number.',
    tech: ['LangGraph', 'FastAPI', 'FAISS', 'Groq', 'React', 'Adzuna API'],
    stat: '100% eval faithfulness · self-critiquing agent',
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
  },
  {
    title: 'AI-Powered Offline Document Q&A Assistant',
    blurb:
      'GPU-free, internet-free document Q&A for field engineers — keyword scoring, phrase matching, and query expansion answer natural-language questions from 300-page manuals in under 2 seconds, at 88% answer relevance.',
    tech: ['Python', 'PyMuPDF', 'NLP', 'Keyword Scoring'],
    stat: '88% relevance · <2s answers',
    emoji: '🔎',
    gradient: 'linear-gradient(135deg, #10b981, #059669 60%, #064e3b)',
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
              <article className="glass glass-hover rounded-3xl overflow-hidden h-full flex flex-col">
                <div
                  className="h-40 grid place-items-center text-6xl relative overflow-hidden"
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
                  <span className="absolute bottom-3 right-4 text-xs font-bold tracking-wide text-white/90 bg-black/30 rounded-full px-3 py-1 backdrop-blur-sm">
                    {p.stat}
                  </span>
                </div>

                <div className="p-7 flex flex-col grow">
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
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
