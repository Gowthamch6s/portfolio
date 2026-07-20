// Ambient background orbs — fixed, heavily blurred, slowly drifting.
export default function GlowOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="orb w-[520px] h-[520px] -top-40 -left-32"
        style={{ background: 'var(--orb-blue)', animation: 'orb-drift 18s ease-in-out infinite' }}
      />
      <div
        className="orb w-[460px] h-[460px] top-[35%] -right-40"
        style={{ background: 'var(--orb-violet)', animation: 'orb-drift 22s ease-in-out infinite reverse' }}
      />
      <div
        className="orb w-[380px] h-[380px] bottom-[-10%] left-[25%]"
        style={{ background: 'var(--orb-cyan)', animation: 'orb-drift 26s ease-in-out infinite' }}
      />
    </div>
  );
}
