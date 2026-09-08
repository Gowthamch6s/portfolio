import * as THREE from 'three';

// Cheap value-noise (no external noise library) — smooth pseudo-random
// rolling hills, deterministic per (x,z) so the ground mesh, road placement,
// and decoration scatter all agree on the same height at any point.
function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const a = hash2(x0, z0);
  const b = hash2(x0 + 1, z0);
  const c = hash2(x0, z0 + 1);
  const d = hash2(x0 + 1, z0 + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

// Ground height at world (x,z) — a few octaves of the above, flattened near
// the world center (spawn) and inside a small radius around each district
// so buildings/roads/characters don't sit on a slope.
export function groundHeight(x, z, flattenZones = []) {
  let h =
    smoothNoise(x * 0.015, z * 0.015) * 6 +
    smoothNoise(x * 0.05, z * 0.05) * 1.8 +
    smoothNoise(x * 0.12, z * 0.12) * 0.5;

  for (const zone of flattenZones) {
    const d = Math.hypot(x - zone.x, z - zone.z);
    if (d < zone.radius) {
      const t = 1 - d / zone.radius; // 1 at center, 0 at the edge
      h = THREE.MathUtils.lerp(h, zone.height ?? 0, t * t);
    }
  }
  return h;
}

// Builds the single continuous ground mesh for the whole world.
export function buildTerrain(size, segments, flattenZones) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grass = new THREE.Color(0x4f9e4a);
  const grassDark = new THREE.Color(0x3c7a3a);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = groundHeight(x, z, flattenZones);
    pos.setY(i, h);
    const shade = THREE.MathUtils.clamp(0.5 + h * 0.06, 0, 1);
    c.copy(grassDark).lerp(grass, shade);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}
