// Flat-vector "vintage travel poster" illustrations — a from-scratch SVG
// attempt at the reference site's bespoke painted poster art behind each
// work item. Not a clone of actual artwork (that would need bespoke
// generated/painted images), but a real illustrated scene per entry
// instead of a flat gradient block, in the same limited-palette,
// layered-silhouette poster language.
const SCENES = {
  // AgentFlow Studio — an abstract circuit/network sky, for the flagship
  // agent-orchestration project.
  circuit: ({ sky, line, glow }) => (
    <>
      <circle cx="70%" cy="30%" r="26" fill={glow} opacity="0.5" />
      <circle cx="70%" cy="30%" r="14" fill={glow} opacity="0.9" />
      {[
        'M0,120 L60,120 L80,90 L160,90 L180,140 L260,140',
        'M0,170 L40,170 L55,150 L140,150 L160,190 L280,190',
        'M20,60 L90,60 L105,80 L200,80',
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke={line} strokeWidth="2.5" opacity="0.55" />
      ))}
      {[
        [60, 120],
        [160, 90],
        [40, 170],
        [140, 150],
        [90, 60],
        [200, 80],
        [180, 140],
        [260, 140],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill={line} opacity="0.8" />
      ))}
    </>
  ),

  // rolling campus greens — used for education/teaching entries
  forest: ({ line, glow }) => (
    <>
      <circle cx="76%" cy="26%" r="22" fill={glow} opacity="0.6" />
      <path d="M0 150 Q60 100 130 140 Q190 90 260 140 L280 200 L0 200 Z" fill={line} opacity="0.22" />
      <path d="M0 175 Q70 130 150 168 Q210 120 280 165 L280 200 L0 200 Z" fill={line} opacity="0.4" />
      {[30, 90, 150, 210, 250].map((x, i) => (
        <g key={x} transform={`translate(${x} ${186 - (i % 2) * 6})`}>
          <path d="M0 -30 L12 -6 L-12 -6 Z" fill={line} opacity="0.7" />
          <path d="M0 -20 L9 0 L-9 0 Z" fill={line} opacity="0.85" />
        </g>
      ))}
    </>
  ),

  // desert mesas — used for scouting/research/inspection entries
  canyon: ({ line, glow }) => (
    <>
      <circle cx="50%" cy="34%" r="30" fill={glow} opacity="0.55" />
      <path d="M0 160 L40 100 L90 100 L120 150 L180 90 L230 90 L280 150 L280 200 L0 200 Z" fill={line} opacity="0.3" />
      <path d="M0 185 L50 140 L100 140 L140 185 L190 130 L280 185 L280 200 L0 200 Z" fill={line} opacity="0.5" />
    </>
  ),

  // ocean horizon — used for career/search/RAG entries
  wave: ({ line, glow }) => (
    <>
      <circle cx="72%" cy="28%" r="24" fill={glow} opacity="0.6" />
      <path d="M0 140 Q40 120 80 140 T160 140 T240 140 T280 140 L280 200 L0 200 Z" fill={line} opacity="0.25" />
      <path d="M0 165 Q40 145 80 165 T160 165 T240 165 T280 165 L280 200 L0 200 Z" fill={line} opacity="0.45" />
    </>
  ),
};

// Simple deterministic hash so the same title always gets the same scene.
function pickScene(seed) {
  const keys = Object.keys(SCENES);
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return keys[n % keys.length];
}

export default function WorkPoster({ title, scene, palette }) {
  const key = scene || pickScene(title);
  const Scene = SCENES[key] || SCENES.circuit;
  const { sky = ['#f5ead0', '#e7c98f'], line = '#26301f', glow = '#c9973f' } = palette || {};
  // gradient <id> must be a valid CSS identifier (no spaces/punctuation) or
  // some browsers silently fail the url(#...) fill reference
  const gradId = `sky-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox="0 0 280 200" preserveAspectRatio="xMidYMid slice" className="w-full h-full block" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="280" height="200" fill={`url(#${gradId})`} />
      <Scene sky={sky} line={line} glow={glow} />
      <rect x="4" y="4" width="272" height="192" fill="none" stroke={line} strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}
