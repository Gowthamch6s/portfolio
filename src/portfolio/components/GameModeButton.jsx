import { motion } from 'framer-motion';

// Floating "enter the solar-system explorer game" button, pinned bottom-left.
export default function GameModeButton() {
  return (
    <motion.a
      href="/game.html"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className="btn-primary fixed bottom-6 left-6 z-50 inline-flex items-center gap-2.5 rounded-full px-5 py-3 font-semibold text-sm"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.4" stroke="currentColor" strokeWidth="1.8" transform="rotate(-20 12 12)" />
      </svg>
      Explore the Solar System
    </motion.a>
  );
}
