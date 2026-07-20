export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Frame-rate independent exponential smoothing — same feel at 30fps and 144fps.
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
