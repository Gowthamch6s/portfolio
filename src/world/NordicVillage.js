import * as THREE from 'three';
import { getTerrainHeight } from '../terrain/Terrain.js';

// A proper snowbound Nordic hamlet around the spawn plaza — falu-red and ochre
// timber houses with white trim, steep snow-capped gable roofs, a bakery, a café,
// a small chapel, a lamp-lit packed-snow road, fences and props. The road polyline
// is exported so Villager NPCs can walk it.

// ---- shared materials (classic Scandinavian palette) ----
const PALETTE = [0x8a3324, 0x8a3324, 0xb0762c, 0x5c6e78, 0x6d4c35, 0x8a3324]; // falu red dominates
const trimMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e2622, roughness: 0.85 });
const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.6 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0x27364a, roughness: 0.6 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0xffdf9e, emissive: 0xffb347, emissiveIntensity: 1.2 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.85 });
const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffc76e, emissiveIntensity: 2.2 });
const ironMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5, metalness: 0.4 });
const roadMat = new THREE.MeshStandardMaterial({
  color: 0xb9c2cf,
  roughness: 0.95,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});

function mesh(geometry, material, castShadow = true) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  return m;
}

// Painted wooden shop sign hung under the roof edge — KAFÉ, BAKERI, etc.
function buildShopSign(text, accent = '#f4e9d8') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#231a12';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.font = '700 72px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.fillText(text, 256, 70);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = mesh(
    new THREE.BoxGeometry(1.7, 0.42, 0.06),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 })
  );
  return board;
}

// Steep Nordic gable roof: two slanted panels whose outer edges land on the wall-top
// corners and inner edges meet at the ridge (same derivation as Cabin.js buildRoof),
// plus a full parallel snow blanket on each panel and a snow ridge cap.
function buildNordicRoof(width, depth, wallHeight, pitch = 0.72) {
  const group = new THREE.Group();
  const halfWidth = width / 2 + 0.25; // slight eave overhang
  const rise = halfWidth * Math.tan(pitch);
  const panelLength = halfWidth / Math.cos(pitch);
  const panelDepth = depth + 0.8;

  for (const side of [-1, 1]) {
    const panel = mesh(new THREE.BoxGeometry(panelLength, 0.09, panelDepth), roofMat);
    panel.position.set((side * halfWidth) / 2, wallHeight + rise / 2, 0);
    panel.rotation.z = -side * pitch;
    group.add(panel);

    // snow blanket — same orientation, nudged up along world Y so it drapes the panel
    const snow = mesh(new THREE.BoxGeometry(panelLength * 0.96, 0.09, panelDepth * 0.98), snowMat);
    snow.position.set((side * halfWidth) / 2, wallHeight + rise / 2 + 0.09, 0);
    snow.rotation.z = -side * pitch;
    group.add(snow);
  }

  const ridge = mesh(new THREE.BoxGeometry(0.34, 0.16, panelDepth), snowMat);
  ridge.position.set(0, wallHeight + rise + 0.05, 0);
  group.add(ridge);

  return { group, rise };
}

// One timber house. `sign` (KAFÉ/BAKERI/…) makes it a shop: bigger windows and a
// hanging signboard. Front face is +Z before rotation.
export function buildNordicHouse({
  width = 4.6,
  depth = 3.8,
  height = 2.6,
  wallColor = 0x8a3324,
  sign = null,
  signAccent = '#f4e9d8',
} = {}) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });

  const walls = mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2;
  group.add(walls);

  // white corner boards — the signature Scandinavian trim
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = mesh(new THREE.BoxGeometry(0.16, height, 0.16), trimMat);
      corner.position.set(sx * (width / 2 - 0.02), height / 2, sz * (depth / 2 - 0.02));
      group.add(corner);
    }
  }
  // fascia board under the roof line, front + back
  for (const sz of [-1, 1]) {
    const fascia = mesh(new THREE.BoxGeometry(width, 0.14, 0.1), trimMat);
    fascia.position.set(0, height - 0.07, sz * (depth / 2 + 0.02));
    group.add(fascia);
  }

  const { group: roof, rise } = buildNordicRoof(width, depth, height);
  group.add(roof);

  // gable triangles (front/back) so the roof isn't hollow-ended
  for (const sz of [-1, 1]) {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-width / 2, 0);
    gableShape.lineTo(width / 2, 0);
    gableShape.lineTo(0, rise);
    gableShape.closePath();
    const gable = mesh(new THREE.ShapeGeometry(gableShape), wallMat);
    gable.position.set(0, height, sz * (depth / 2 - 0.01));
    if (sz < 0) gable.rotation.y = Math.PI;
    group.add(gable);
  }

  // chimney with a snow cap
  const chimney = mesh(new THREE.BoxGeometry(0.4, 1.0, 0.4), new THREE.MeshStandardMaterial({ color: 0x777c85, roughness: 0.9 }));
  chimney.position.set(width * 0.22, height + rise * 0.55 + 0.4, -depth * 0.12);
  group.add(chimney);
  const chimneySnow = mesh(new THREE.BoxGeometry(0.46, 0.09, 0.46), snowMat);
  chimneySnow.position.copy(chimney.position).y += 0.55;
  group.add(chimneySnow);

  // door with white frame
  const doorFrame = mesh(new THREE.BoxGeometry(0.94, 1.5, 0.06), trimMat);
  doorFrame.position.set(0, 0.75, depth / 2 + 0.02);
  group.add(doorFrame);
  const door = mesh(new THREE.BoxGeometry(0.74, 1.34, 0.08), doorMat);
  door.position.set(0, 0.67, depth / 2 + 0.05);
  group.add(door);

  // windows with white frames + warm light; shops get wide storefront windows
  const windowW = sign ? 0.95 : 0.55;
  const windowH = sign ? 0.7 : 0.6;
  for (const side of [-1, 1]) {
    const frame = mesh(new THREE.BoxGeometry(windowW + 0.16, windowH + 0.16, 0.05), trimMat);
    frame.position.set(side * width * 0.3, height * 0.55, depth / 2 + 0.02);
    group.add(frame);
    const glow = mesh(new THREE.BoxGeometry(windowW, windowH, 0.06), windowMat, false);
    glow.position.set(side * width * 0.3, height * 0.55, depth / 2 + 0.04);
    group.add(glow);
    // cross mullions
    const mullionV = mesh(new THREE.BoxGeometry(0.05, windowH, 0.07), trimMat, false);
    mullionV.position.set(side * width * 0.3, height * 0.55, depth / 2 + 0.05);
    group.add(mullionV);
    const mullionH = mesh(new THREE.BoxGeometry(windowW, 0.05, 0.07), trimMat, false);
    mullionH.position.set(side * width * 0.3, height * 0.55, depth / 2 + 0.05);
    group.add(mullionH);
  }
  // side windows
  for (const side of [-1, 1]) {
    const frame = mesh(new THREE.BoxGeometry(0.05, 0.7, 0.66), trimMat);
    frame.position.set(side * (width / 2 + 0.01), height * 0.55, 0);
    group.add(frame);
    const glow = mesh(new THREE.BoxGeometry(0.06, 0.56, 0.52), windowMat, false);
    glow.position.set(side * (width / 2 + 0.03), height * 0.55, 0);
    group.add(glow);
  }

  if (sign) {
    const board = buildShopSign(sign, signAccent);
    board.position.set(0, height - 0.45, depth / 2 + 0.12);
    group.add(board);
  }

  return group;
}

// Small chapel: narrow tall house + square tower with a spire.
function buildChapel() {
  const group = new THREE.Group();
  const body = buildNordicHouse({ width: 3.6, depth: 5, height: 3, wallColor: 0xf2efe6 });
  group.add(body);

  const tower = mesh(new THREE.BoxGeometry(1.5, 4.4, 1.5), trimMat);
  tower.position.set(0, 2.2, 3.2);
  group.add(tower);
  const spire = mesh(new THREE.ConeGeometry(1.15, 2.4, 4), roofMat);
  spire.position.set(0, 5.6, 3.2);
  spire.rotation.y = Math.PI / 4;
  group.add(spire);
  const spireSnow = mesh(new THREE.ConeGeometry(1.2, 0.5, 4), snowMat);
  spireSnow.position.set(0, 4.65, 3.2);
  spireSnow.rotation.y = Math.PI / 4;
  group.add(spireSnow);
  // belfry window
  const belfry = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), windowMat, false);
  belfry.position.set(0, 3.6, 3.96);
  group.add(belfry);

  return group;
}

// Warm wrought-iron street lamp.
function buildLampPost() {
  const group = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 6), ironMat);
  pole.position.y = 1.3;
  group.add(pole);
  const arm = mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), ironMat);
  arm.position.set(0, 2.55, 0.2);
  group.add(arm);
  const lantern = mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), lampMat, false);
  lantern.position.set(0, 2.4, 0.42);
  group.add(lantern);
  const cap = mesh(new THREE.ConeGeometry(0.22, 0.18, 4), ironMat);
  cap.position.set(0, 2.62, 0.42);
  cap.rotation.y = Math.PI / 4;
  group.add(cap);
  const light = new THREE.PointLight(0xffc76e, 6, 9, 2);
  light.position.set(0, 2.35, 0.42);
  group.add(light);
  return group;
}

// Simple picket fence segment along +X, `length` long.
function buildFence(length) {
  const group = new THREE.Group();
  const rail = mesh(new THREE.BoxGeometry(length, 0.07, 0.06), darkWoodMat);
  rail.position.y = 0.55;
  group.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 0.3;
  group.add(rail2);
  const posts = Math.max(2, Math.round(length / 1.1));
  for (let i = 0; i < posts; i++) {
    const post = mesh(new THREE.BoxGeometry(0.09, 0.8, 0.09), darkWoodMat);
    post.position.set(-length / 2 + (i / (posts - 1)) * length, 0.4, 0);
    group.add(post);
    const snowDab = mesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), snowMat, false);
    snowDab.position.set(post.position.x, 0.83, 0);
    group.add(snowDab);
  }
  return group;
}

function buildBench() {
  const group = new THREE.Group();
  const seat = mesh(new THREE.BoxGeometry(1.3, 0.08, 0.4), darkWoodMat);
  seat.position.y = 0.45;
  group.add(seat);
  const back = mesh(new THREE.BoxGeometry(1.3, 0.35, 0.06), darkWoodMat);
  back.position.set(0, 0.75, -0.18);
  group.add(back);
  for (const side of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.08, 0.45, 0.36), ironMat);
    leg.position.set(side * 0.55, 0.22, 0);
    group.add(leg);
  }
  const snowLine = mesh(new THREE.BoxGeometry(1.3, 0.05, 0.4), snowMat, false);
  snowLine.position.y = 0.5;
  group.add(snowLine);
  return group;
}

function buildBarrel() {
  const barrel = mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.75, 9), darkWoodMat);
  barrel.position.y = 0.375;
  const group = new THREE.Group();
  group.add(barrel);
  const lid = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 9), snowMat, false);
  lid.position.y = 0.78;
  group.add(lid);
  return group;
}

// Packed-snow road ribbon following a polyline, sampled to hug the terrain.
function buildRoad(points, width = 3) {
  const positions = [];
  const indices = [];
  const STEP = 1.4;
  let vi = 0;

  for (let seg = 0; seg < points.length - 1; seg++) {
    const a = points[seg];
    const b = points[seg + 1];
    const segLen = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(2, Math.ceil(segLen / STEP));
    const dirX = (b.x - a.x) / segLen;
    const dirZ = (b.z - a.z) / segLen;
    const perpX = -dirZ;
    const perpZ = dirX;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = a.x + (b.x - a.x) * t;
      const cz = a.z + (b.z - a.z) * t;
      const lx = cx + perpX * (width / 2);
      const lz = cz + perpZ * (width / 2);
      const rx = cx - perpX * (width / 2);
      const rz = cz - perpZ * (width / 2);
      positions.push(lx, getTerrainHeight(lx, lz) + 0.06, lz);
      positions.push(rx, getTerrainHeight(rx, rz) + 0.06, rz);
      if (i > 0) {
        const p = vi - 2;
        indices.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
      }
      vi += 2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, roadMat);
  road.receiveShadow = true;
  return road;
}

// Places `thing` on the terrain at (x, z) facing `rotationY`.
function place(group, thing, x, z, rotationY = 0) {
  thing.position.set(x, getTerrainHeight(x, z), z);
  thing.rotation.y = rotationY;
  group.add(thing);
}

// The main village street villagers walk along (world x/z). Exported for Villager NPCs.
export const VILLAGE_ROAD = [
  { x: -32, z: 66 },
  { x: -22, z: 61 },
  { x: -10, z: 57 },
  { x: 0, z: 53 },
  { x: 10, z: 51 },
  { x: 22, z: 53 },
  { x: 33, z: 58 },
];

const SKI_SPUR = [
  { x: 0, z: 53 },
  { x: 0, z: 43 },
  { x: 0, z: 34 },
];

// Angle so a house at (x,z) faces a road point (rx,rz): front (+Z) toward the road.
function faceToward(x, z, rx, rz) {
  return Math.atan2(rx - x, rz - z);
}

export function createNordicVillage() {
  const group = new THREE.Group();

  group.add(buildRoad(VILLAGE_ROAD, 3.2));
  group.add(buildRoad(SKI_SPUR, 2.4));

  // ---- north side (uphill, behind the road) ----
  place(group, buildNordicHouse({ wallColor: 0xb0762c, sign: 'BAKERI', signAccent: '#ffd98a' }), -19, 68, faceToward(-19, 68, -22, 61));
  place(group, buildNordicHouse({ wallColor: 0x8a3324, sign: 'KAFÉ', signAccent: '#ffb27d' }), -6, 63, faceToward(-6, 63, -10, 57));
  place(group, buildNordicHouse({ wallColor: 0x5c6e78 }), 8, 58, faceToward(8, 58, 10, 51));
  place(group, buildNordicHouse({ wallColor: 0x8a3324, width: 4, depth: 3.4 }), 20, 60, faceToward(20, 60, 22, 53));
  place(group, buildNordicHouse({ wallColor: 0x6d4c35, sign: 'HANDEL', signAccent: '#cfe3a8' }), 31, 64, faceToward(31, 64, 33, 58));
  place(group, buildChapel(), -30, 73, faceToward(-30, 73, -32, 66) + Math.PI); // tower at back

  // ---- south side (downhill of the road, clear of the ski corridor spur) ----
  place(group, buildNordicHouse({ wallColor: 0x8a3324, width: 4.2 }), -24, 55, faceToward(-24, 55, -22, 61));
  place(group, buildNordicHouse({ wallColor: 0xb0762c, width: 4, depth: 3.4 }), -13, 51, faceToward(-13, 51, -10, 57));
  place(group, buildNordicHouse({ wallColor: 0x5c6e78, width: 4.2 }), 16, 45, faceToward(16, 45, 10, 51));
  place(group, buildNordicHouse({ wallColor: 0x6d4c35, width: 3.8, depth: 3.2 }), 27, 47, faceToward(27, 47, 22, 53));

  // ---- street lamps along the road ----
  const lampSpots = [
    [-27, 64.5], [-15, 59.5], [-4, 55.5], [6, 52.5], [16, 51.5], [27, 56],
    [1.8, 47], [-1.8, 38],
  ];
  for (const [lx, lz] of lampSpots) place(group, buildLampPost(), lx, lz, Math.random() * Math.PI * 2);

  // ---- fences, benches, barrels ----
  place(group, buildFence(5), -19, 64.5, -0.45);
  place(group, buildFence(4.5), 20, 56.5, -0.3);
  place(group, buildFence(4), -30, 68.6, -0.55);
  place(group, buildBench(), -7.4, 60.5, faceToward(-7.4, 60.5, -10, 57) + Math.PI);
  place(group, buildBench(), 9.4, 55.6, faceToward(9.4, 55.6, 10, 51) + Math.PI);
  place(group, buildBarrel(), -17.6, 65.6, 0);
  place(group, buildBarrel(), -4.4, 61.1, 0);
  place(group, buildBarrel(), 29.4, 61.6, 0);

  return { group, road: VILLAGE_ROAD };
}
