import * as THREE from 'three';
import { groundHeight } from './Terrain.js';

const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9, flatShading: true });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3016, roughness: 0.85 });
const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.6, metalness: 0.4 });
const lampBulbMat = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffcf6b, emissiveIntensity: 2.2 });

// Samples-per-leg used by buildRoadMesh — shared so junction placement (a
// sample index per waypoint) and road-sample generation always agree.
const SAMPLES_PER_LEG = 24;

function makeRng(seedStr) {
  let seed = seedStr.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Dark asphalt with a solid white edge line each side and a dashed white
// centerline — matches the reference game's road markings.
function buildRoadTexture() {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#24262b';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#eef0f4';
  ctx.fillRect(w * 0.07, 0, w * 0.045, h);
  ctx.fillRect(w * 0.885, 0, w * 0.045, h);
  const dashLen = h * 0.14;
  for (let y = 0; y < h; y += dashLen * 2) ctx.fillRect(w * 0.478, y, w * 0.044, dashLen);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Denser, taller two-tone grass blade so tips read as sunlit highlights.
// Two perpendicular planes crossed in an "X" (the standard cheap-grass
// trick) instead of one flat plane, so a blade always reads as a tuft of
// grass from any angle instead of vanishing edge-on or reading as a single
// flat green wall up close.
function buildBladeGeometry() {
  const single = new THREE.PlaneGeometry(0.14, 0.45, 1, 3);
  single.translate(0, 0.225, 0);
  const crossed = single.clone();
  crossed.rotateY(Math.PI / 2);
  const merged = mergeGeometries(single, crossed);

  const colors = new Float32Array(merged.attributes.position.count * 3);
  const base = new THREE.Color(0x2f7d34);
  const tip = new THREE.Color(0x9be86a);
  const c = new THREE.Color();
  const posAttr = merged.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const t = posAttr.getY(i) / 0.45;
    c.copy(base).lerp(tip, THREE.MathUtils.clamp(t, 0, 1));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return merged;
}

// Minimal two-geometry merge (position + uv), avoiding an extra examples/
// addon import just to combine two planes into one draw call per instance.
function mergeGeometries(a, b) {
  const merged = new THREE.BufferGeometry();
  const posA = a.attributes.position.array;
  const posB = b.attributes.position.array;
  const uvA = a.attributes.uv.array;
  const uvB = b.attributes.uv.array;
  const idxA = a.index.array;
  const idxB = b.index.array;
  const offset = posA.length / 3;

  const positions = new Float32Array(posA.length + posB.length);
  positions.set(posA, 0);
  positions.set(posB, posA.length);
  const uvs = new Float32Array(uvA.length + uvB.length);
  uvs.set(uvA, 0);
  uvs.set(uvB, uvA.length);
  const indices = new Uint32Array(idxA.length + idxB.length);
  indices.set(idxA, 0);
  for (let i = 0; i < idxB.length; i++) indices[idxA.length + i] = idxB[i] + offset;

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}

// Wind-swaying grass material: displaces each blade's upper vertices with a
// per-instance-phased sine wave so the whole field ripples like real grass
// instead of standing perfectly rigid.
function buildWindGrassMaterial() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uTime;\nattribute float aPhase;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nfloat windLift = clamp(position.y / 0.45, 0.0, 1.0);\nfloat sway = sin(uTime * 1.6 + aPhase) * windLift * windLift * 0.16;\ntransformed.x += sway;\ntransformed.z += sway * 0.7;`
      );
    mat.userData.shader = shader;
  };
  return mat;
}

function buildTree(rand) {
  const group = new THREE.Group();
  const trunkH = 1.1 + rand() * 0.7;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  group.add(trunk);
  const leafColor = new THREE.Color().setHSL(0.33 + rand() * 0.05, 0.6, 0.24 + rand() * 0.1);
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, flatShading: true });
  const tiers = 3 + Math.floor(rand() * 2);
  for (let t = 0; t < tiers; t++) {
    const size = (1.0 - t * 0.16) * (0.9 + rand() * 0.3);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(size, size * 1.5, 7), leafMat);
    cone.position.y = trunkH + t * 0.6 + size * 0.65;
    group.add(cone);
  }
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return group;
}

function buildLampPost(rand) {
  const group = new THREE.Group();
  const h = 3.2 + rand() * 0.4;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), lampPoleMat);
  pole.position.y = h / 2;
  pole.castShadow = true;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), lampPoleMat);
  arm.position.set(0.25, h - 0.1, 0);
  group.add(arm);
  const bulbMat = lampBulbMat.clone();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), bulbMat);
  bulb.position.set(0.5, h - 0.16, 0);
  group.add(bulb);
  const light = new THREE.PointLight(0xffcf6b, 2.2, 11, 2);
  light.position.copy(bulb.position);
  group.add(light);
  return { group, bulbMat, light, phase: rand() * Math.PI * 2 };
}

// Canvas-painted glowing window grid — wrapped around all four sides of a
// glass tower so it reads as a lit-up skyscraper from any angle.
function buildGlassTexture(rand, accentColor) {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const glass = new THREE.Color().setHSL(0.58, 0.35, 0.16 + rand() * 0.08);
  ctx.fillStyle = `#${glass.getHexString()}`;
  ctx.fillRect(0, 0, w, h);

  const accent = new THREE.Color(accentColor);
  const cols = 6;
  const rows = 16;
  const cellW = w / cols;
  const cellH = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.32) continue; // dark windows
      const lit = rand() < 0.4;
      const color = lit ? accent : new THREE.Color(0xbfe6ff);
      ctx.fillStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${0.5 + rand() * 0.4})`;
      ctx.fillRect(c * cellW + cellW * 0.18, r * cellH + cellH * 0.22, cellW * 0.64, cellH * 0.56);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildBuilding(rand, accentColor) {
  const w = 2.6 + rand() * 2.6;
  const d = 2.6 + rand() * 2.6;
  const h = 8 + rand() * 22;
  const group = new THREE.Group();

  const glassTex = buildGlassTexture(rand, accentColor);
  glassTex.wrapS = THREE.RepeatWrapping;
  glassTex.repeat.set(1, Math.max(1, h / 8));
  const bodyMat = new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.35, metalness: 0.25, emissive: accentColor, emissiveIntensity: 0.08 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  let beaconMat = null;
  // rooftop antenna + blinking beacon on taller towers
  if (h > 18) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 3, 5), lampPoleMat);
    antenna.position.y = h + 1.5;
    group.add(antenna);
    beaconMat = new THREE.MeshStandardMaterial({ color: 0xff5a4a, emissive: 0xff5a4a, emissiveIntensity: 2 });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), beaconMat);
    beacon.position.y = h + 3;
    group.add(beacon);
  }

  return { group, beaconMat, beaconPhase: rand() * Math.PI * 2 };
}

// Simple low-poly car — box body, cabin, four wheels, emissive head/tail
// lights — driven along the road by RoadTraffic.
function buildCar(rand) {
  const bodyColor = new THREE.Color().setHSL(rand(), 0.55, 0.42 + rand() * 0.15);
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.2, metalness: 0.4 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.8 });
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff6cf, emissive: 0xfff6cf, emissiveIntensity: 2 });
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 1.8 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.42, 2.0), bodyMat);
  body.position.y = 0.36;
  body.castShadow = true;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.34, 1.0), glassMat);
  cabin.position.set(0, 0.72, -0.15);
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [
    [0.48, 0.65],
    [-0.48, 0.65],
    [0.48, -0.65],
    [-0.48, -0.65],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, 0.22, wz);
    group.add(wheel);
  }

  const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), headlightMat);
  headlightL.position.set(0.32, 0.38, 1.0);
  group.add(headlightL);
  const headlightR = headlightL.clone();
  headlightR.position.x = -0.32;
  group.add(headlightR);
  const taillightL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), taillightMat);
  taillightL.position.set(0.32, 0.38, -1.0);
  group.add(taillightL);
  const taillightR = taillightL.clone();
  taillightR.position.x = -0.32;
  group.add(taillightR);

  return group;
}

// Traffic-light fixture: pole + arm + red/yellow/green head. `setState(0|1|2)`
// lights exactly one lamp (green/yellow/red) at a time, matching a normal
// signal cycle, and drives a real PointLight so it actually illuminates the
// junction, not just glows in place.
function buildTrafficLight() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 6), lampPoleMat);
  pole.position.y = 1.3;
  pole.castShadow = true;
  group.add(pole);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.24), new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.6 }));
  housing.position.y = 2.85;
  group.add(housing);

  const colors = [0x3ddc6b, 0xffd23d, 0xff453a];
  const lamps = colors.map((color, i) => {
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.08 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), mat);
    lamp.position.set(0, 2.85 + 0.26 - i * 0.27, 0.14);
    group.add(lamp);
    return mat;
  });

  const light = new THREE.PointLight(colors[0], 0, 8, 2);
  light.position.set(0, 2.85, 0.3);
  group.add(light);

  const controller = { group, state: 0 };
  controller.setState = (state) => {
    controller.state = state;
    lamps.forEach((mat, i) => {
      mat.emissiveIntensity = i === state ? 2.4 : 0.08;
    });
    light.color.setHex(colors[state]);
    light.intensity = 2.5;
  };
  controller.setState(0);

  return controller;
}

// A road connecting waypoints ({x,z} world positions), following the actual
// ground height along the way so it never floats or clips into a hill.
function buildRoadMesh(waypoints, flattenZones, width = 4.2) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const samples = [];
  const perLeg = SAMPLES_PER_LEG;

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
    const y = groundHeight(p.x, p.z, flattenZones) + 0.08;

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
  return { mesh, samples, cumLength };
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

// Roads connecting spawn -> every district in sequence, lined with street
// lamps and traffic-light junctions at each district entrance, plus dense
// per-district scatter (grass/trees/rocks off the road) and a glass-tower
// skyline per district. `flattenZones` must be the SAME list the terrain
// mesh was built with, or every ground-anchored prop below would sit at the
// raw noisy height instead of the flattened terrain and float/sink.
//
// Returns everything main.js needs to animate: grass wind shader, blinking
// rooftop beacons and street lamps, traffic-light cycling, and the road
// `samples` polyline + junction indices for cars to drive along.
export function decorateWorld(scene, spawnPos, districts, flattenZones) {
  const group = new THREE.Group();
  scene.add(group);

  const waypoints = [spawnPos, ...districts.map((d) => d.position)];
  const { mesh: roadMesh, samples } = buildRoadMesh(waypoints, flattenZones);
  group.add(roadMesh);
  const roadWaypoints = waypoints;

  // street lamps every ~14 samples along the road, alternating sides
  const lamps = [];
  const lampRand = makeRng('lamps');
  for (let i = 4; i < samples.length - 2; i += 14) {
    const p = samples[i];
    const next = samples[Math.min(i + 1, samples.length - 1)];
    const dirX = next.x - p.x;
    const dirZ = next.z - p.z;
    const len = Math.hypot(dirX, dirZ) || 1;
    const side = i % 28 < 14 ? 1 : -1;
    const rightX = (-dirZ / len) * side;
    const rightZ = (dirX / len) * side;
    const lampX = p.x + rightX * 3.4;
    const lampZ = p.z + rightZ * 3.4;
    const lamp = buildLampPost(lampRand);
    lamp.group.position.set(lampX, groundHeight(lampX, lampZ, flattenZones), lampZ);
    lamp.group.rotation.y = Math.atan2(rightX, rightZ);
    group.add(lamp.group);
    lamps.push(lamp);
  }

  // a traffic-light junction at every district entrance along the road
  const trafficLights = [];
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const dirX = waypoints[i].x - prev.x;
    const dirZ = waypoints[i].z - prev.z;
    const len = Math.hypot(dirX, dirZ) || 1;
    const rightX = -dirZ / len;
    const rightZ = dirX / len;
    const lx = waypoints[i].x + rightX * 3.6;
    const lz = waypoints[i].z + rightZ * 3.6;
    const tl = buildTrafficLight();
    tl.group.position.set(lx, groundHeight(lx, lz, flattenZones), lz);
    tl.group.rotation.y = Math.atan2(-rightX, -rightZ);
    group.add(tl.group);
    tl.sampleIndex = i * SAMPLES_PER_LEG;
    trafficLights.push(tl);
  }

  // a handful of cars patrolling the road (the road is one open chain
  // spawn->d1->d2->...->dN, not a closed loop, so cars ping-pong end to end
  // rather than teleporting through a wraparound) and stopping at red/yellow
  // traffic lights instead of driving straight through them.
  const cars = [];
  const carRand = makeRng('cars');
  const totalCars = 6;
  const maxDist = samples.length - 1;
  for (let i = 0; i < totalCars; i++) {
    const carGroup = buildCar(carRand);
    group.add(carGroup);
    cars.push({
      group: carGroup,
      dist: (i / totalCars) * maxDist,
      dir: carRand() < 0.5 ? 1 : -1,
      speed: 6 + carRand() * 3,
    });
  }

  // dense grass across the whole terrain via InstancedMesh, wind-swayed
  const bladeGeo = buildBladeGeometry();
  const bladeMat = buildWindGrassMaterial();
  const bladeCount = 16000;
  const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
  const phases = new Float32Array(bladeCount);
  const dummy = new THREE.Object3D();
  const worldRand = makeRng('world-grass');
  const halfSize = 195;
  let placed = 0;
  let attempts = 0;
  while (placed < bladeCount && attempts < bladeCount * 2) {
    attempts++;
    const x = (worldRand() - 0.5) * halfSize * 2;
    const z = (worldRand() - 0.5) * halfSize * 2;
    if (distanceToPolyline(x, z, roadWaypoints) < 2) continue;
    const y = groundHeight(x, z, flattenZones);
    dummy.position.set(x, y, z);
    dummy.rotation.y = worldRand() * Math.PI * 2;
    const s = 0.8 + worldRand() * 0.5;
    dummy.scale.set(s, s * (0.9 + worldRand() * 0.3), s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    phases[placed] = worldRand() * Math.PI * 2;
    placed++;
  }
  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  grass.receiveShadow = true;
  grass.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  group.add(grass);

  const beacons = [];

  for (const district of districts) {
    const rand = makeRng(district.id);
    const { x: cx, z: cz } = district.position;

    // trees + rocks scattered densely around the district's clearing, off road
    for (let i = 0; i < 44; i++) {
      const a = rand() * Math.PI * 2;
      const r = district.clearRadius * (0.3 + rand() * 0.85);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (distanceToPolyline(x, z, roadWaypoints) < 2.2) continue;
      const y = groundHeight(x, z, flattenZones);
      const deco3d = rand() < 0.65 ? buildTree(rand) : new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rand() * 0.7, 0), rockMat);
      deco3d.position.set(x, y, z);
      deco3d.rotation.y = rand() * Math.PI * 2;
      if (deco3d.isMesh) deco3d.castShadow = true;
      group.add(deco3d);
    }

    // a denser glass-tower skyline on the far side of the district from spawn
    const awayX = cx - spawnPos.x;
    const awayZ = cz - spawnPos.z;
    const awayLen = Math.hypot(awayX, awayZ) || 1;
    const awayDirX = awayX / awayLen;
    const awayDirZ = awayZ / awayLen;
    const perpX = -awayDirZ;
    const perpZ = awayDirX;
    for (let i = 0; i < 10; i++) {
      const spread = (rand() - 0.5) * district.clearRadius * 1.1;
      const forward = district.clearRadius * (0.45 + rand() * 0.4);
      const x = cx + awayDirX * forward + perpX * spread;
      const z = cz + awayDirZ * forward + perpZ * spread;
      const y = groundHeight(x, z, flattenZones);
      const { group: building, beaconMat, beaconPhase } = buildBuilding(rand, district.color);
      building.position.set(x, y, z);
      building.rotation.y = rand() * Math.PI * 2;
      group.add(building);
      if (beaconMat) beacons.push({ mat: beaconMat, phase: beaconPhase });
    }
  }

  let elapsed = 0;
  let signalTimer = 0;
  let signalState = 0; // 0 green, 1 yellow, 2 red
  const SIGNAL_DURATIONS = [5, 1.2, 4.5];

  function update(dt) {
    elapsed += dt;

    // wind-swaying grass
    if (bladeMat.userData.shader) bladeMat.userData.shader.uniforms.uTime.value = elapsed;

    // blinking rooftop beacons — a sharp on/off blink, not a smooth pulse
    for (const b of beacons) {
      b.mat.emissiveIntensity = Math.sin(elapsed * 3 + b.phase) > 0.4 ? 2.4 : 0.1;
    }

    // street lamps flicker very subtly so they read as "on" rather than static
    for (const l of lamps) {
      const flicker = 0.9 + 0.1 * Math.sin(elapsed * 5 + l.phase);
      l.bulbMat.emissiveIntensity = 2.2 * flicker;
      l.light.intensity = 2.2 * flicker;
    }

    // shared traffic-light cycle: green -> yellow -> red -> green
    signalTimer += dt;
    if (signalTimer >= SIGNAL_DURATIONS[signalState]) {
      signalTimer = 0;
      signalState = (signalState + 1) % 3;
      for (const tl of trafficLights) tl.setState(signalState);
    }

    // cars driving the road, ping-ponging at each end and stopping at a
    // red/yellow traffic light ahead of them instead of driving through it
    const STOP_MARGIN = 3.2; // sample-index units before the signal
    for (const car of cars) {
      let blocked = false;
      for (const tl of trafficLights) {
        if (tl.state === 0) continue; // green — never blocks
        const ahead = car.dir > 0 ? tl.sampleIndex - car.dist : car.dist - tl.sampleIndex;
        if (ahead > 0 && ahead < STOP_MARGIN) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        car.dist += car.dir * car.speed * dt;
        if (car.dist >= maxDist) {
          car.dist = maxDist;
          car.dir = -1;
        } else if (car.dist <= 0) {
          car.dist = 0;
          car.dir = 1;
        }
      }

      const i0 = THREE.MathUtils.clamp(Math.floor(car.dist), 0, maxDist - 1);
      const i1 = i0 + 1;
      const t = car.dist - i0;
      const p0 = samples[i0];
      const p1 = samples[i1];
      const x = THREE.MathUtils.lerp(p0.x, p1.x, t);
      const z = THREE.MathUtils.lerp(p0.z, p1.z, t);
      const y = groundHeight(x, z, flattenZones) + 0.1;
      car.group.position.set(x, y, z);
      // face the direction of travel — reversed when driving the leg backwards
      const facing = Math.atan2(p1.x - p0.x, p1.z - p0.z) + (car.dir < 0 ? Math.PI : 0);
      car.group.rotation.y = facing;
    }
  }

  return {
    group,
    update,
    roadSamples: samples,
    cars,
    trafficLights,
  };
}

// Places each district's content nodes as glowing monuments arranged in a
// small ring around the district center. Returns [{ mesh, worldPos, node }].
export function placeDistrictNodes(scene, district, flattenZones) {
  const placed = [];
  const { x: cx, z: cz } = district.position;
  const n = district.nodes.length;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const r = district.clearRadius * 0.4;
    const x = cx + Math.cos(angle) * r;
    const z = cz + Math.sin(angle) * r;
    const y = groundHeight(x, z, flattenZones);

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
