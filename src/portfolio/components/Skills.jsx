import { motion } from 'framer-motion';
import Reveal from './Reveal.jsx';

// The core toolset, presented as a backcountry equipment permit — a direct
// structural homage to the reference site's "MY TOOLS OF THE TRADE" panel.
// Every note below is grounded in the real projects/experience elsewhere on
// this site, not invented.
const TOOLS = [
  { tool: 'PyTorch / TensorFlow', note: 'model training — the visual-defect CNN classifier (96.4% acc), compressed to 10MB via TFLite.' },
  { tool: 'LangChain / LangGraph', note: 'multi-agent pipelines — self-correcting state machines, human-in-the-loop interrupt() checkpoints.' },
  { tool: 'FastAPI', note: 'backend + SSE streaming for live agent dashboards.' },
  { tool: 'React / Next.js', note: 'the site you’re reading is proof. two years shipping this stack in production.' },
  { tool: 'RAG (FAISS, Pinecone, ChromaDB)', note: 'grounding agent output in retrieved context instead of letting it hallucinate.' },
  { tool: 'Docker / CI-CD', note: 'containerized services, isolated per-thread E2B sandboxes for LLM-generated code.' },
  { tool: 'MLflow', note: 'an independent LLM-judge eval pass, tracked separately from a graph’s own in-graph critique.' },
  { tool: 'PostgreSQL / MongoDB', note: 'durable state for agent graphs and app data alike.' },
  { tool: 'Azure (AI-900 certified)', note: 'cloud fundamentals, model + app deployment.' },
  { tool: 'Figma', note: 'UI/UX direction for a tutoring platform used daily by thousands.' },
  { tool: 'Python / TypeScript', note: 'daily drivers, model layer to browser.' },
  { tool: 'Git / Linux', note: 'obviously.' },
];

const ADDITIONAL = [
  { label: 'NLP / Models', skills: ['Keras', 'Scikit-learn', 'Hugging Face', 'BERT / RoBERTa', 'NLP', 'LLMs'] },
  { label: 'Agent Tooling', skills: ['Prompt Engineering', 'OpenAI API', 'Groq', 'Ollama', 'E2B'] },
  { label: 'Languages', skills: ['JavaScript', 'SQL', 'Bash', 'Java', 'C++'] },
  { label: 'Infra', skills: ['REST APIs', 'PySpark', 'Responsive Design'] },
];

export default function Skills() {
  return (
    <section id="skills" className="relative py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            <span className="gradient-text">02.</span> Skills
          </h2>
        </Reveal>

        <Reveal>
          <div className="permit-doc rounded-sm p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              <span>Form 10-26 · OMB No. 0826-2026</span>
              <span>Dept. of Engineering — Agentic Division</span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl mt-4">My Tools of the Trade</h3>

            <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-muted)' }}>Permittee</span>
                <p className="font-semibold">Gowtham Sai Chimmana</p>
              </div>
              <div>
                <span className="uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-muted)' }}>Party of</span>
                <p className="font-semibold">1 (+ agents)</p>
              </div>
              <div className="sm:col-span-2 mt-1">
                <span className="uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-muted)' }}>Endorsements</span>
                <p className="font-semibold leading-snug">
                  Agentic AI &middot; LLM Engineering &middot; RAG Systems &middot; Model Training &middot; Full-Stack Delivery
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[560px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    <th className="pb-2 pr-3 font-normal w-10">No.</th>
                    <th className="pb-2 pr-3 font-normal">Tool or Equipment</th>
                    <th className="pb-2 pr-3 font-normal">My Field Notes</th>
                    <th className="pb-2 font-normal w-24">Packed</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map((row, i) => (
                    <motion.tr
                      key={row.tool}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="permit-row align-top"
                    >
                      <td className="py-2.5 pr-3" style={{ color: 'var(--text-muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 pr-3 font-bold whitespace-nowrap">{row.tool}</td>
                      <td className="py-2.5 pr-3" style={{ color: 'var(--text-muted)' }}>
                        {row.note}
                      </td>
                      <td className="py-2.5" style={{ color: 'var(--accent-3)' }}>
                        &mdash; packed
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-xs italic" style={{ color: 'var(--text-muted)' }}>
              I certify that the equipment listed above is packed, field-tested, and stakeholder-ready.
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <span className="hand-accent text-2xl">Gowtham Sai Chimmana</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Signature of Permittee
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADDITIONAL.map((group) => (
              <div key={group.label} className="glass rounded-2xl p-5">
                <h4 className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
                  {group.label}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span key={skill} className="skill-chip rounded-full px-3 py-1.5 text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
