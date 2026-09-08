import { motion } from 'framer-motion';

// Trail-sign distance markers as flavor, not literal — a small homage to
// the reference site's national-park-permit nav styling.
const LINKS = [
  ['About', '#about', '150 FT'],
  ['Skills', '#skills', '0.3 MI'],
  ['Work', '#projects', '0.7 MI'],
  ['Photography', '#photography', '1.1 MI'],
  ['Contact', '#contact', '1.3 MI'],
];

// Floating pill nav — flat paper card, no theme toggle (single light look).
export default function Navbar({ muted, onToggleMuted }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <nav className="glass pointer-events-auto flex items-center gap-2 sm:gap-5 rounded-full pl-5 pr-2 py-2">
        <a href="#top" className="font-display text-base mr-1">
          <span className="gradient-text">GC</span>
          <span style={{ color: 'var(--text-muted)' }}>.dev</span>
        </a>

        <ul className="hidden md:flex items-center gap-5 text-sm font-medium">
          {LINKS.map(([label, href, distance]) => (
            <li key={href}>
              <a href={href} className="nav-link flex flex-col items-center leading-tight">
                <span>{label}</span>
                <span
                  className="text-sm font-normal hand-accent leading-none"
                  style={{ color: 'var(--accent-2)' }}
                >
                  {distance} ↓
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 ml-1">
          <button
            onClick={onToggleMuted}
            aria-label={muted ? 'Unmute companion narration' : 'Mute companion narration'}
            title={muted ? 'Unmute companion narration' : 'Mute companion narration'}
            className="hidden lg:grid btn-secondary w-9 h-9 rounded-full place-items-center text-base cursor-pointer"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <a
            href="/game.html"
            className="btn-primary hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <span aria-hidden="true">🪐</span> Solar Explorer
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
