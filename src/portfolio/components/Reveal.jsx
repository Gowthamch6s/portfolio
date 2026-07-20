import { motion } from 'framer-motion';

// Shared scroll-reveal wrapper: fades + slides content in when it enters view.
export default function Reveal({ children, delay = 0, y = 36, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
