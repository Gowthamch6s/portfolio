import * as THREE from 'three';
import { fbm2D } from '../utils/noise.js';

// The mountain runs downhill along -Z. Everything below (mesh generation, player physics,
// panel placement) shares this single height function so the visual terrain and the
// gameplay collision surface can never drift apart.
const SLOPE_STEEPNESS = 0.34;
const VALLEY_SCALE = 0.05;
const VALLEY_AMPLITUDE = 6;
const ROUGHNESS_SCALE = 0.18;
const ROUGHNESS_AMPLITUDE = 1.2;

// The mesh is finite — export its extent so Player.js can keep the skier from sliding past
// the edge into empty space beyond the generated ground.
export const TERRAIN_WIDTH = 400;
export const TERRAIN_DEPTH = 900;

// The constant angle of the overall incline — player ski gravity is derived from this fixed
// angle alone (see Player.js), not from the local terrain normal. The visual mesh below is
// bumpy (valleys + fine roughness), and sampling *that* noisy surface for gravity direction
// would make gravity randomly point "uphill" inside every small ripple or valley dip. A
// constant slope-aligned gravity vector is both simpler and matches real skiing: a skier's
// momentum follows the mountain's overall grade, gliding over — not steered by — its texture.
export const SLOPE_ANGLE = Math.atan(SLOPE_STEEPNESS);

export function getTerrainHeight(x, z) {
  const downhill = z * SLOPE_STEEPNESS; // height falls as z decreases, so -Z is downhill
  const valley = fbm2D(x * VALLEY_SCALE, z * VALLEY_SCALE, 3) * VALLEY_AMPLITUDE - VALLEY_AMPLITUDE * 0.5;
  const roughness = (fbm2D(x * ROUGHNESS_SCALE + 100, z * ROUGHNESS_SCALE + 100, 3) - 0.5) * ROUGHNESS_AMPLITUDE;
  return downhill + valley + roughness;
}

// Just past the real terrain's edge (±450) — the linear slope term keeps climbing forever
// otherwise, tilting the far horizon into an absurd ramp. Background dressing (the far ground
// skirt, distant mountains) reads off this clamped variant instead so it flattens out gently
// once past the playable area, while staying pixel-continuous with the real terrain right up
// to the clamp boundary.
const FAR_Z_CLAMP = TERRAIN_DEPTH / 2 + 30;
export function getFarTerrainHeight(x, z) {
  return getTerrainHeight(x, THREE.MathUtils.clamp(z, -FAR_Z_CLAMP, FAR_Z_CLAMP));
}

// Central-difference gradient/normal of the full detailed surface — used only for mesh vertex
// normals and rock/snow shading, never for player physics.
export function getTerrainGradient(x, z, epsilon = 0.5) {
  const left = getTerrainHeight(x - epsilon, z);
  const right = getTerrainHeight(x + epsilon, z);
  const down = getTerrainHeight(x, z - epsilon);
  const up = getTerrainHeight(x, z + epsilon);
  return {
    dHdx: (right - left) / (2 * epsilon),
    dHdz: (up - down) / (2 * epsilon),
  };
}

export function getTerrainNormal(x, z) {
  const { dHdx, dHdz } = getTerrainGradient(x, z);
  return new THREE.Vector3(-dHdx, 1, -dHdz).normalize();
}

// Shared by the playable terrain and the far-ground skirt below — both are just the same
// height field at different extents/resolutions, colored identically by local steepness.
function buildHeightfieldGeometry(width, depth, segmentsW, segmentsD, heightFn = getTerrainHeight, heightOffset = 0) {
  const geometry = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsD);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const snow = new THREE.Color(0.94, 0.96, 1.0);
  const rock = new THREE.Color(0.32, 0.3, 0.28);
  const epsilon = 0.5;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, heightFn(x, z) + heightOffset);

    // Local steepness from the same heightFn (rather than the exported, always-unclamped
    // getTerrainNormal) so shading stays consistent where the far skirt flattens out.
    const dHdx = (heightFn(x + epsilon, z) - heightFn(x - epsilon, z)) / (2 * epsilon);
    const dHdz = (heightFn(x, z + epsilon) - heightFn(x, z - epsilon)) / (2 * epsilon);
    const normalY = 1 / Math.sqrt(1 + dHdx * dHdx + dHdz * dHdz);
    const steepness = 1 - normalY;
    const color = steepness > 0.55 ? rock : snow;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createTerrainMesh({ width = TERRAIN_WIDTH, depth = TERRAIN_DEPTH, segmentsW = 130, segmentsD = 260 } = {}) {
  const geometry = buildHeightfieldGeometry(width, depth, segmentsW, segmentsD);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// A huge, low-resolution extension of the same height field, sitting a hair below the real
// playable terrain so it renders seamlessly underneath and beyond it — no visible seam where
// the finite ski-run mesh ends, and the ground rolls naturally right up to the mountain bases.
export function createFarGroundSkirt({ size = 2600, segments = 90 } = {}) {
  const geometry = buildHeightfieldGeometry(size, size, segments, segments, getFarTerrainHeight, -0.08);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// A dark rocky arch sunk into the slope, standing in for a "cave entrance" waypoint marker.
export function createCaveEntrance(x, z) {
  const y = getTerrainHeight(x, z);
  const group = new THREE.Group();

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.95, metalness: 0.05 });
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.4, 6, 16, 1, true, 0, Math.PI), rockMaterial);
  mouth.rotation.z = Math.PI / 2;
  mouth.rotation.y = Math.PI / 2;
  mouth.position.set(x, y + 2.2, z);
  mouth.castShadow = true;
  mouth.receiveShadow = true;

  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1, side: THREE.BackSide });
  const interior = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 12), darkMaterial);
  interior.position.set(x, y + 1.8, z + 0.6);

  group.add(mouth, interior);
  return group;
}
