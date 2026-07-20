import { motion } from 'framer-motion';

// Floating "enter the ski game" button, pinned bottom-left.
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
          d="M6 9h4M8 7v4M15 8.5h.01M17.5 11h.01M7.5 5h9a5.5 5.5 0 0 1 5.42 6.44l-.63 3.6a3 3 0 0 1-5.4 1.19L14.5 14.5h-5l-1.39 1.73a3 3 0 0 1-5.4-1.19l-.63-3.6A5.5 5.5 0 0 1 7.5 5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Switch to 3D Game Mode
    </motion.a>
  );
}
