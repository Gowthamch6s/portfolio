// Decorative wavy "map" path bridging one section to the next — a dashed
// S-curve from one side of the content column to the other, echoing the
// zigzag the floating companion actually walks between resting spots.
// Purely visual: aria-hidden, no pointer events.
export default function TrailConnector({ fromRight = true, toRight = false, height = 130 }) {
  const fromX = fromRight ? 84 : 16;
  const toX = toRight ? 84 : 16;
  const midX = (fromX + toX) / 2;
  const gradId = `trail-grad-${fromRight ? 'r' : 'l'}-${toRight ? 'r' : 'l'}`;

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto max-w-6xl px-5 sm:px-8 pointer-events-none hidden sm:block"
      style={{ height }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{ opacity: 0.5 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <path
          d={`M ${fromX} 0 C ${midX} 35, ${midX} 65, ${toX} 100`}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="1.8"
          strokeDasharray="3.5 4.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={fromX} cy="3" r="2.2" fill="var(--accent)" />
        <circle cx={toX} cy="97" r="2.2" fill="var(--accent-2)" />
      </svg>
    </div>
  );
}
