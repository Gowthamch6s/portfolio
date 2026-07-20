import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Character from './Character.jsx';
import { useActiveSection } from '../hooks/useActiveSection.js';

// Per-section resting spot for the companion, in viewport units so it works
// as a `position: fixed` overlay regardless of how tall each section actually
// renders. `right` genuinely alternates between hugging the right edge and
// hugging the left edge (a small/negative value = right side, a value near
// 85-90vw = left side, since it's still measured from the right) — this is
// what makes the walk between sections read as a real zigzag down a trail,
// matching the wavy map drawn between sections (see TrailConnector.jsx)
// instead of the character just sitting glued to one edge the whole time.
const SECTION_ORDER = ['top', 'about', 'skills', 'projects', 'experience', 'photography', 'contact'];

const POSITIONS = {
  top: { top: '52vh', right: '8vw', scale: 1 },
  about: { top: '14vh', right: '78vw', scale: 0.5 },
  skills: { top: '60vh', right: '-10vw', scale: 0.5 },
  projects: { top: '16vh', right: '78vw', scale: 0.55 },
  experience: { top: '62vh', right: '-10vw', scale: 0.5 },
  photography: { top: '19vh', right: '78vw', scale: 0.55 },
  contact: { top: '48vh', right: '-10vw', scale: 0.46 },
};

// Below 1024px, `max-w-6xl` content fills nearly the full viewport width —
// there's no real gutter left for a right-edge-hugging companion at the
// scales above, so this range gets its own much smaller, edge-hugging table
// instead of just being hidden outright.
const COMPACT_POSITIONS = {
  top: { top: '50vh', right: '4vw', scale: 0.6 },
  about: { top: '10vh', right: '82vw', scale: 0.32 },
  skills: { top: '58vh', right: '-24vw', scale: 0.32 },
  projects: { top: '11vh', right: '82vw', scale: 0.34 },
  experience: { top: '60vh', right: '-24vw', scale: 0.32 },
  photography: { top: '13vh', right: '82vw', scale: 0.34 },
  contact: { top: '44vh', right: '-24vw', scale: 0.3 },
};

const COMPACT_BREAKPOINT = 1024;

const WALK_DURATION = 1100; // roughly matches the position spring settling
const GREETING_FALLBACK_DURATION = 20000; // safety net if speech never fires an 'end' event
const MUTED_GREETING_DURATION = 3600; // wave-only duration when there's no speech to sync to

// Spoken separately from the on-screen hero copy — spelled out phonetically
// so a TTS engine doesn't stumble over "LLM"/"GPU"/acronyms, and punctuated
// for a livelier, more energetic read.
const HERO_SPEECH =
  "Hi! I'm an optimistic A I, M L Engineer with a knack for shipping end to end intelligent systems! " +
  'From zero compute enterprise summarizers, to live A I career coaches, I love building tools that ' +
  "actually help people! And as a quick learner, I'm always evolving my tech stack, and ready for the " +
  'next big challenge!';

// Picks the brightest-sounding available voice — real browsers don't expose
// an age/energy parameter, so this is the practical best-effort: prefer
// voices that tend to read younger/livelier over the flat default, then push
// pitch and rate up rather than the flatter, lower default reading.
function pickEnthusiasticVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = [/Google UK English Female/i, /Samantha/i, /Zira/i, /Female/i, /Google US English/i];
  for (const pattern of preferred) {
    const match = voices.find((v) => pattern.test(v.name) && v.lang.startsWith('en'));
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith('en')) || voices[0];
}

// Mounted once at the App level so it persists across the whole scroll —
// medium screens and up (md+, 768px): below that there's no readable way to
// fit it beside single-column mobile content at all, so it simply doesn't
// render there.
export default function FloatingCompanion({ muted = false }) {
  const active = useActiveSection();

  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const table = viewportWidth < COMPACT_BREAKPOINT ? COMPACT_POSITIONS : POSITIONS;
  const pos = table[active] || table.top;

  const prevIndexRef = useRef(SECTION_ORDER.indexOf('top'));
  const walkTimeoutRef = useRef(null);
  const [walking, setWalking] = useState(false);
  const [lookY, setLookY] = useState(null);
  const [greeting, setGreeting] = useState(false);

  // Walk + look-toward-section whenever the active section actually changes.
  useEffect(() => {
    const idx = SECTION_ORDER.indexOf(active);
    const prevIdx = prevIndexRef.current;
    if (idx === -1 || idx === prevIdx) return undefined;

    const movingDown = idx > prevIdx;
    prevIndexRef.current = idx;

    setWalking(true);
    setLookY(movingDown ? 1 : -1);

    clearTimeout(walkTimeoutRef.current);
    walkTimeoutRef.current = setTimeout(() => {
      setWalking(false);
      setLookY(null);
    }, WALK_DURATION);

    return () => clearTimeout(walkTimeoutRef.current);
  }, [active]);

  // Wave + narrate every time the hero comes into view (initial load, or
  // scrolling back up to it) — cancelled early if you scroll away first.
  // The wave keeps going for as long as the speech actually takes (via the
  // utterance's `end` event) rather than a flat guessed duration, with a
  // generous fallback timeout in case the browser never fires it.
  useEffect(() => {
    if (active !== 'top') return undefined;
    setGreeting(true);

    let fallback;
    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!muted && hasSpeech) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(HERO_SPEECH);
      const voice = pickEnthusiasticVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.15;
      utterance.pitch = 1.55;
      utterance.onend = () => setGreeting(false);
      utterance.onerror = () => setGreeting(false);

      if (window.speechSynthesis.getVoices().length) {
        window.speechSynthesis.speak(utterance);
      } else {
        // Voice list loads async in some browsers — speak as soon as it's ready.
        window.speechSynthesis.onvoiceschanged = () => {
          const readyVoice = pickEnthusiasticVoice();
          if (readyVoice) utterance.voice = readyVoice;
          window.speechSynthesis.speak(utterance);
        };
      }
      fallback = setTimeout(() => setGreeting(false), GREETING_FALLBACK_DURATION);
    } else {
      fallback = setTimeout(() => setGreeting(false), MUTED_GREETING_DURATION);
    }

    return () => {
      clearTimeout(fallback);
      if (hasSpeech) window.speechSynthesis.cancel();
    };
  }, [active, muted]);

  return (
    <motion.div
      className="fixed z-30 pointer-events-none hidden md:block"
      style={{ top: 0, right: 0 }}
      animate={{ top: pos.top, right: pos.right, scale: pos.scale }}
      transition={{ type: 'spring', stiffness: 55, damping: 15, mass: 1 }}
    >
      <div className="pointer-events-auto -translate-y-1/2">
        <Character walking={walking} lookY={lookY} greeting={greeting} />
      </div>
    </motion.div>
  );
}
