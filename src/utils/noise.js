// Deterministic 2D value-noise, hand-rolled (no simplex-noise / perlin deps) so terrain
// generation stays fully manual per the "no external physics/noise engines" brief.

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise2D(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const zf = z - z0;

  const topLeft = hash(x0, z0);
  const topRight = hash(x0 + 1, z0);
  const bottomLeft = hash(x0, z0 + 1);
  const bottomRight = hash(x0 + 1, z0 + 1);

  const u = smoothstep(xf);
  const v = smoothstep(zf);

  const top = topLeft + (topRight - topLeft) * u;
  const bottom = bottomLeft + (bottomRight - bottomLeft) * u;
  return top + (bottom - top) * v; // range: 0..1
}

// Fractal Brownian Motion — layers several octaves of value noise for natural-looking
// mountain roughness instead of a single blobby sine wave.
export function fbm2D(x, z, octaves = 4, lacunarity = 2, gain = 0.5) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * frequency, z * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / norm; // range: 0..1
}
