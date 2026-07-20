import Reveal from './Reveal.jsx';

export default function About() {
  return (
    <section id="about" className="relative py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            <span className="gradient-text">01.</span> About Me
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          <Reveal className="md:col-span-2">
            <div className="glass glass-hover rounded-3xl p-8 sm:p-10 h-full">
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                CS graduate student at the{' '}
                <strong style={{ color: 'var(--text)' }}>University of South Florida</strong>{' '}
                (GPA 3.50), <strong style={{ color: 'var(--text)' }}>Teaching Assistant for
                Operating Systems</strong>, and contributor to faculty-led{' '}
                <strong style={{ color: 'var(--text)' }}>neural-symbolic AI research</strong>.
              </p>
              <p className="text-lg leading-relaxed mt-5" style={{ color: 'var(--text-muted)' }}>
                I&apos;m full-stack across the AI product — 2 years shipping production software
                as a frontend engineer at an EdTech startup, now building the model layer
                (PyTorch / LangChain), backend (FastAPI), and frontend (React) end-to-end. I can
                own an AI feature from data to deployed interface without a hand-off.
              </p>
              <p className="text-lg leading-relaxed mt-5" style={{ color: 'var(--text-muted)' }}>
                Currently seeking <strong style={{ color: 'var(--text)' }}>AI Engineer, ML
                Engineer, or Applied LLM roles</strong>. Authorized to work in the US (OPT).
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass glass-hover rounded-3xl p-8 h-full flex flex-col justify-center gap-6">
              {[
                ['🎓', 'MS CS @ USF · GPA 3.50'],
                ['🧠', 'LLM & RAG systems builder'],
                ['🔬', 'Neural-symbolic AI research'],
                ['🚀', 'Model → UI, end to end'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-2xl" aria-hidden="true">
                    {icon}
                  </span>
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
