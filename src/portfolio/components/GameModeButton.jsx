import { motion } from 'framer-motion';

// Floating "enter the treasure-hunt boat game" button, pinned bottom-left.
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
        <path
          d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0M4 19c1.5-1.7 3-1.7 4.5 0s3 1.7 4.5 0 3-1.7 4.5 0M12 4v6M9 7l3-3 3 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Play the Treasure Hunt
    </motion.a>
  );
}
