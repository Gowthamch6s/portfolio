import { motion } from 'framer-motion';
import CuteMountains from './CuteMountains.jsx';

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      <CuteMountains className="absolute bottom-0 inset-x-0 z-0 opacity-90" />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full">
        {/* Text stays narrower than the full width — the floating companion
            (mounted globally, see FloatingCompanion.jsx) occupies the right
            side here at rest, recreating the old two-column look without
            being locked into this section's layout. */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm font-semibold tracking-[0.25em] uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            Agentic AI &amp; Generative AI Engineer · LLMs, RAG
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight glow-text"
          >
            Hi, I&apos;m <span className="gradient-text">Gowtham Sai Chimmana</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-6 text-lg sm:text-xl leading-relaxed max-w-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            Optimistic <strong style={{ color: 'var(--text)' }}>AI/ML Engineer</strong> with a knack
            for shipping <strong style={{ color: 'var(--text)' }}>end-to-end intelligent systems</strong>.
            From zero-compute enterprise summarizers to{' '}
            <strong style={{ color: 'var(--text)' }}>live AI career coaches</strong>, I love building
            tools that actually help people. As a quick learner, I&apos;m always evolving my tech
            stack and ready for the next big challenge.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a href="#projects" className="btn-primary rounded-full px-7 py-3.5 font-semibold">
              View Projects
            </a>
            <a
              href="/resume.pdf"
              download
              className="btn-secondary rounded-full px-7 py-3.5 font-semibold"
            >
              Download Resume ↓
            </a>
          </motion.div>
        </div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xl"
        style={{ color: 'var(--accent-2)' }}
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="inline-block hand-accent"
        >
          the scenic route starts here ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
