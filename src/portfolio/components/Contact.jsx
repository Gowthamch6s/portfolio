import { useState } from 'react';
import Reveal from './Reveal.jsx';
import CuteMountains from './CuteMountains.jsx';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`Portfolio contact from ${data.get('name')}`);
    const body = encodeURIComponent(`${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`);
    window.location.href = `mailto:gowthamch6s@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <footer id="contact" className="relative py-24 scroll-mt-20 overflow-hidden">
      <CuteMountains className="absolute bottom-0 inset-x-0 z-0 opacity-60 scale-x-[-1]" />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            <span className="gradient-text">05.</span> Get in Touch
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="glass rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between gap-8">
              <div>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Hiring for Agentic AI, Generative AI, or ML Engineer roles — or just want to
                  talk shop about LangGraph agents and RAG pipelines? My inbox is open.
                  Tampa, FL · gowthamch6s@gmail.com
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <a
                  href="https://github.com/Gowthamch6s"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary rounded-2xl px-6 py-4 font-semibold flex items-center gap-3"
                >
                  <span aria-hidden="true">🐙</span> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/gowthamchimmana"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary rounded-2xl px-6 py-4 font-semibold flex items-center gap-3"
                >
                  <span aria-hidden="true">💼</span> LinkedIn
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 sm:p-10 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Name
                <input name="name" required className="field rounded-xl px-4 py-3 text-base font-normal" placeholder="Your name" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Email
                <input name="email" type="email" required className="field rounded-xl px-4 py-3 text-base font-normal" placeholder="you@example.com" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Message
                <textarea name="message" required rows="4" className="field rounded-xl px-4 py-3 text-base font-normal resize-none" placeholder="Let's build something…" />
              </label>
              <button type="submit" className="btn-primary rounded-xl px-6 py-3.5 font-bold mt-2 cursor-pointer">
                {sent ? 'Opening your mail app…' : 'Send Message ✦'}
              </button>
            </form>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <p className="text-center text-sm mt-16" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Gowtham Sai Chimmana · Built with React, Tailwind &amp; a
            straw hat 👒
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
