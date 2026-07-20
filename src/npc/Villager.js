import * as THREE from 'three';
import { getTerrainHeight } from '../terrain/Terrain.js';
import { VILLAGE_ROAD } from '../world/NordicVillage.js';

// Villagers strolling the village street — simple low-poly folk in winter coats
// and beanies, walking back and forth along the road polyline with leg/arm swing,
// occasional pauses, and a small per-villager lateral lane offset so they don't
// all march single-file down the centerline.

const COAT_COLORS = [0x91442c, 0x3f5d52, 0x51486e, 0x7a6636, 0x30475e, 0x6e3b47];
const HAT_COLORS = [0xd94f4f, 0x3b6ea5, 0xe0b13e, 0x4f8a5b, 0xd97b3f, 0xececec];

const skinMat = new THREE.MeshStandardMaterial({ color: 0xead9c4, roughness: 0.8 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2c3340, roughness: 0.75 });
const bootMat = new THREE.MeshStandardMaterial({ color: 0x1b1715, roughness: 0.55 });

const WALK_SPEED = 1.15;
const PAUSE_CHANCE_PER_SEC = 0.06;
const PAUSE_DURATION = [1.5, 4];

function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
}

function buildVillagerMesh(coatColor, hatColor) {
  const group = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.8 });
  const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.9 });

  const torso = mesh(new THREE.CapsuleGeometry(0.24, 0.46, 4, 8), coatMat);
  torso.position.y = 1.28;
  group.add(torso);

  const head = mesh(new THREE.SphereGeometry(0.19, 12, 12), skinMat);
  head.position.y = 1.86;
  group.add(head);

  const beanie = mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
  beanie.position.y = 1.88;
  group.add(beanie);
  const bobble = mesh(new THREE.SphereGeometry(0.06, 8, 8), hatMat);
  bobble.position.y = 2.08;
  group.add(bobble);

  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.13, 0.92, 0);
    const leg = mesh(new THREE.CapsuleGeometry(0.09, 0.42, 4, 6), pantsMat);
    leg.position.y = -0.32;
    hip.add(leg);
    const boot = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.3), bootMat);
    boot.position.set(0, -0.62, 0.04);
    hip.add(boot);
    group.add(hip);
    legs.push(hip);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.33, 1.55, 0);
    const arm = mesh(new THREE.CapsuleGeometry(0.075, 0.36, 4, 6), coatMat);
    arm.position.y = -0.26;
    shoulder.add(arm);
    const mitten = mesh(new THREE.SphereGeometry(0.08, 8, 8), hatMat);
    mitten.position.y = -0.5;
    shoulder.add(mitten);
    group.add(shoulder);
    arms.push(shoulder);
  }

  return { group, legs, arms };
}

// Cumulative segment lengths so a scalar distance maps to a road position.
function buildRoadMetric(road) {
  const lengths = [0];
  for (let i = 1; i < road.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(road[i].x - road[i - 1].x, road[i].z - road[i - 1].z));
  }
  return lengths;
}

class Villager {
  constructor(scene, road, roadLengths, index) {
    const built = buildVillagerMesh(
      COAT_COLORS[index % COAT_COLORS.length],
      HAT_COLORS[(index * 2 + 1) % HAT_COLORS.length]
    );
    this.mesh = built.group;
    this.legs = built.legs;
    this.arms = built.arms;
    scene.add(this.mesh);

    this.road = road;
    this.roadLengths = roadLengths;
    this.totalLength = roadLengths[roadLengths.length - 1];

    this.distance = Math.random() * this.totalLength;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.laneOffset = (Math.random() - 0.5) * 1.6; // stay off the exact centerline
    this.speed = WALK_SPEED * (0.85 + Math.random() * 0.35);
    this.pauseTimer = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.heading = 0;
  }

  _roadPointAt(distance) {
    const d = THREE.MathUtils.clamp(distance, 0, this.totalLength);
    let seg = 0;
    while (seg < this.roadLengths.length - 2 && this.roadLengths[seg + 1] < d) seg++;
    const a = this.road[seg];
    const b = this.road[seg + 1];
    const segLen = this.roadLengths[seg + 1] - this.roadLengths[seg];
    const t = segLen > 0 ? (d - this.roadLengths[seg]) / segLen : 0;
    const dirX = (b.x - a.x) / segLen;
    const dirZ = (b.z - a.z) / segLen;
    return {
      x: a.x + (b.x - a.x) * t - dirZ * this.laneOffset,
      z: a.z + (b.z - a.z) * t + dirX * this.laneOffset,
      dirX,
      dirZ,
    };
  }

  update(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      // settle limbs while paused
      for (const leg of this.legs) leg.rotation.x *= 0.92;
      for (const arm of this.arms) arm.rotation.x *= 0.92;
      return;
    }
    if (Math.random() < PAUSE_CHANCE_PER_SEC * dt) {
      this.pauseTimer = PAUSE_DURATION[0] + Math.random() * (PAUSE_DURATION[1] - PAUSE_DURATION[0]);
      return;
    }

    this.distance += this.speed * this.direction * dt;
    if (this.distance >= this.totalLength || this.distance <= 0) {
      this.direction *= -1;
      this.distance = THREE.MathUtils.clamp(this.distance, 0, this.totalLength);
    }

    const p = this._roadPointAt(this.distance);
    this.mesh.position.set(p.x, getTerrainHeight(p.x, p.z), p.z);

    const targetHeading = Math.atan2(p.dirX * this.direction, p.dirZ * this.direction);
    let delta = targetHeading - this.heading;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.heading += delta * Math.min(1, dt * 6);
    this.mesh.rotation.y = this.heading;

    // walk cycle
    this.phase += dt * this.speed * 4.6;
    const swing = Math.sin(this.phase) * 0.55;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.arms[0].rotation.x = -swing * 0.7;
    this.arms[1].rotation.x = swing * 0.7;
  }
}

export class VillagerCrowd {
  constructor(scene, count = 6) {
    const roadLengths = buildRoadMetric(VILLAGE_ROAD);
    this.villagers = [];
    for (let i = 0; i < count; i++) {
      this.villagers.push(new Villager(scene, VILLAGE_ROAD, roadLengths, i));
    }
  }

  update(dt) {
    for (const v of this.villagers) v.update(dt);
  }
}
