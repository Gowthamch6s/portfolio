import * as THREE from 'three';
import { groundHeight } from './Terrain.js';

const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9, flatShading: true });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.85 });

function makeRng(seedStr) {
  let seed = seedStr.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function buildRoadTexture() {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2b2e33';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8e8e0';
  ctx.fillRect(w * 0.08, 0, w * 0.05, h);
  ctx.fillRect(w * 0.87, 0, w * 0.05, h);
  ctx.fillStyle = '#e8c23c';
  const dashLen = h * 0.16;
  for (let y = 0; y < h; y += dashLen * 2) ctx.fillRect(w * 0.475, y, w * 0.05, dashLen);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function buildTree(rand) {
  const group = new THREE.Group();
  const trunkH = 0.9 + rand() * 0.5;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  group.add(trunk);
  const leafColor = new THREE.Color().setHSL(0.32 + rand() * 0.05, 0.55, 0.32 + rand() * 0.12);
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, flatShading: true });
  const tiers = 2 + Math.floor(rand() * 2);
  for (let t = 0; t < tiers; t++) {
    const size = (0.85 - t * 0.18) * (0.85 + rand() * 0.3);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(size, size * 1.4, 7), leafMat);
    cone.position.y = trunkH + t * 0.55 + size * 0.6;
    group.add(cone);
  }
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return group;
}

function buildBuilding(rand, accentColor) {
  const w = 2.2 + rand() * 2;
  const d = 2.2 + rand() * 2;
  const h = 5 + rand() * 14;
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.6, 0.08, 0.25 + rand() * 0.15), roughness: 0.7 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);
  const windowMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 1.3 });
  const rows = Math.max(1, Math.floor(h / 1.3));
  for (let r = 0; r < rows; r++) {
    if (rand() < 0.4) continue;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.22, 0.03), windowMat);
    strip.position.set(0, 0.9 + r * 1.3, d / 2 + 0.01);
    group.add(strip);
  }
  return group;
}

// A road connecting waypoints ({x,z} world positions), following the actual
// ground height along the way so it never floats or clips into a hill.
function buildRoadMesh(waypoints, width = 3.2) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const samples = [];
  const perLeg = 24;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    for (let s = 0; s <= perLeg; s++) {
      if (i > 0 && s === 0) continue; // avoid duplicating the shared joint point
      const t = s / perLeg;
      samples.push({ x: THREE.MathUtils.lerp(a.x, b.x, t), z: THREE.MathUtils.lerp(a.z, b.z, t) });
    }
  }

  let cumLength = 0;
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const next = samples[Math.min(i + 1, samples.length - 1)];
    const dirX = next.x - p.x;
    const dirZ = next.z - p.z;
    const len = Math.hypot(dirX, dirZ) || 1;
    const rightX = -dirZ / len;
    const rightZ = dirX / len;
    const y = groundHeight(p.x, p.z, []) + 0.08;

    positions.push(p.x - (rightX * width) / 2, y, p.z - (rightZ * width) / 2);
    positions.push(p.x + (rightX * width) / 2, y, p.z + (rightZ * width) / 2);
    const v = cumLength / 8;
    uvs.push(0, v, 1, v);
    if (i < samples.length - 1) cumLength += Math.hypot(next.x - p.x, next.z - p.z);

    if (i > 0) {
      const base = (i - 1) * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const texture = buildRoadTexture();
  texture.repeat.set(1, Math.max(1, Math.round(cumLength / 8)));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }));
  mesh.receiveShadow = true;
  return mesh;
}

function distanceToPolyline(x, z, waypoints) {
  let min = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    const t = THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / len2, 0, 1);
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < min) min = d;
  }
  return min;
}

// Roads connecting spawn -> every district in order (a simple hub-and-spoke
// route), plus per-district scatter (grass/trees/rocks off the road) and a
// small building cluster per district tinted with its accent color.
export function decorateWorld(scene, spawnPos, districts) {
  const group = new THREE.Group();
  scene.add(group);

  const waypoints = [spawnPos, ...districts.map((d) => d.position)];
  group.add(buildRoadMesh(waypoints));
  const roadWaypoints = waypoints;

  // dense grass across the whole terrain via InstancedMesh
  const bladeGeo = new THREE.PlaneGeometry(0.18, 0.55);
  bladeGeo.translate(0, 0.275, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x5fbf5a, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const bladeCount = 6000;
  const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
  const dummy = new THREE.Object3D();
  const worldRand = makeRng('world-grass');
  const halfSize = 190;
  let placed = 0;
  let attempts = 0;
  while (placed < bladeCount && attempts < bladeCount * 2) {
    attempts++;
    const x = (worldRand() - 0.5) * halfSize * 2;
    const z = (worldRand() - 0.5) * halfSize * 2;
    if (distanceToPolyline(x, z, roadWaypoints) < 1.2) continue;
    const y = groundHeight(x, z, []);
    dummy.position.set(x, y, z);
    dummy.rotation.y = worldRand() * Math.PI * 2;
    const s = 0.7 + worldRand() * 0.7;
    dummy.scale.set(s, s * (0.8 + worldRand() * 0.5), s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  grass.receiveShadow = true;
  group.add(grass);

  for (const district of districts) {
    const rand = makeRng(district.id);
    const { x: cx, z: cz } = district.position;

    // trees + rocks scattered around the district's clearing, off the road
    for (let i = 0; i < 22; i++) {
      const a = rand() * Math.PI * 2;
      const r = district.clearRadius * (0.35 + rand() * 0.75);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (distanceToPolyline(x, z, roadWaypoints) < 1.8) continue;
      const y = groundHeight(x, z, []);
      const deco3d = rand() < 0.6 ? buildTree(rand) : new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rand() * 0.6, 0), rockMat);
      deco3d.position.set(x, y, z);
      deco3d.rotation.y = rand() * Math.PI * 2;
      if (deco3d.isMesh) deco3d.castShadow = true;
      group.add(deco3d);
    }

    // a small building cluster on the far side of the district from spawn
    const awayX = cx - spawnPos.x;
    const awayZ = cz - spawnPos.z;
    const awayLen = Math.hypot(awayX, awayZ) || 1;
    const awayDirX = awayX / awayLen;
    const awayDirZ = awayZ / awayLen;
    const perpX = -awayDirZ;
    const perpZ = awayDirX;
    for (let i = 0; i < 6; i++) {
      const spread = (rand() - 0.5) * district.clearRadius * 0.9;
      const forward = district.clearRadius * (0.5 + rand() * 0.3);
      const x = cx + awayDirX * forward + perpX * spread;
      const z = cz + awayDirZ * forward + perpZ * spread;
      const y = groundHeight(x, z, []);
      const building = buildBuilding(rand, district.color);
      building.position.set(x, y, z);
      building.rotation.y = rand() * Math.PI * 2;
      group.add(building);
    }
  }

  return group;
}

// Places each district's content nodes as glowing monuments arranged in a
// small ring around the district center. Returns [{ mesh, worldPos, node }].
export function placeDistrictNodes(scene, district) {
  const placed = [];
  const { x: cx, z: cz } = district.position;
  const n = district.nodes.length;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const r = district.clearRadius * 0.4;
    const x = cx + Math.cos(angle) * r;
    const z = cz + Math.sin(angle) * r;
    const y = groundHeight(x, z, []);

    const monument = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x1c2530, roughness: 0.6 }));
    monument.add(base);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: district.color, emissive: district.color, emissiveIntensity: 1.1, roughness: 0.3 })
    );
    pillar.position.y = 1.05;
    monument.add(pillar);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: district.color, emissive: district.color, emissiveIntensity: 1.6 }));
    orb.position.y = 2.05;
    monument.add(orb);
    const light = new THREE.PointLight(district.color, 3, 14, 2);
    light.position.y = 2.1;
    monument.add(light);

    monument.position.set(x, y, z);
    monument.castShadow = true;
    scene.add(monument);

    placed.push({ mesh: monument, worldPos: new THREE.Vector3(x, y, z), node: district.nodes[i] });
  }
  return placed;
}
