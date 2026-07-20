// Decorative chibi mountain range — rounded (not jagged) peaks with snow
// caps, tiny pine trees, and a little glowing sun/moon, using theme CSS
// variables so it repaints automatically for dark/light mode. Purely
// decorative: aria-hidden, no pointer events, sits behind section content.
export default function CuteMountains({ className = '' }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1000 260"
        preserveAspectRatio="none"
        className="w-full h-auto block"
      >
        {/* little glowing sun/moon tucked behind the peaks */}
        <circle cx="230" cy="70" r="34" fill="var(--accent-3)" opacity="0.55" />
        <circle cx="230" cy="70" r="20" fill="var(--accent-3)" opacity="0.85" />

        {/* back layer — softest, furthest away */}
        <path
          d="M0 200 Q 90 90 180 170 Q 250 90 320 170 Q 400 70 480 170 Q 560 100 640 170
             Q 720 80 800 170 Q 880 110 1000 170 L1000 260 L0 260 Z"
          fill="var(--accent-2)"
          opacity="0.16"
        />

        {/* middle layer */}
        <path
          d="M0 230 Q 110 130 220 210 Q 300 140 380 210 Q 470 110 560 210
             Q 650 150 740 210 Q 830 130 1000 210 L1000 260 L0 260 Z"
          fill="var(--accent)"
          opacity="0.2"
        />

        {/* front layer — biggest, most saturated, with snow caps */}
        <g opacity="0.9">
          <path
            d="M-20 260 Q 60 130 140 200 L 175 172 L 210 200 Q 290 110 370 200
               L 405 170 L 440 200 Q 520 120 600 205 L 635 178 L 670 205
               Q 750 140 830 210 L 1020 210 L 1020 260 Z"
            fill="var(--surface-strong)"
            stroke="var(--border-strong)"
            strokeWidth="2"
          />
          {/* rounded snow caps sitting right on each peak tip */}
          <path d="M118 155 Q140 138 162 155 L150 175 Q140 182 130 175 Z" fill="var(--text)" opacity="0.9" />
          <path d="M348 148 Q370 128 392 148 L380 172 Q370 180 360 172 Z" fill="var(--text)" opacity="0.9" />
          <path d="M578 152 Q600 132 622 152 L610 176 Q600 184 590 176 Z" fill="var(--text)" opacity="0.9" />
        </g>

        {/* tiny pine trees along the base */}
        {[70, 260, 460, 700, 900].map((x, i) => (
          <g key={x} transform={`translate(${x} ${230 - (i % 2) * 6})`}>
            <path d="M0 -34 L14 -8 L-14 -8 Z" fill="var(--accent-2)" opacity="0.55" />
            <path d="M0 -24 L11 0 L-11 0 Z" fill="var(--accent-2)" opacity="0.65" />
            <rect x="-2.5" y="0" width="5" height="7" fill="var(--text-muted)" opacity="0.6" />
          </g>
        ))}
      </svg>
    </div>
  );
}
