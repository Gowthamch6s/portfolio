import * as THREE from 'three';
import { buildHuskyMesh } from './Husky.js';
import { getTerrainHeight } from '../terrain/Terrain.js';
import { damp } from '../utils/mathUtils.js';

const WALK_SPEED = 1.8;
const TURN_RATE = 2.5;
const ARRIVE_RADIUS = 1.5;
const IDLE_CHANCE = 0.3; // chance of a short pause after reaching a target

class Husky {
  constructor(scene, bounds) {
    this.bounds = bounds;
    const { group, legs } = buildHuskyMesh();
    this.group = group;
    this.legs = legs;
    this.heading = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.idleTime = 0;
    this.animTime = Math.random() * 10;

    const { x, z } = this._randomPointInBounds();
    this.group.position.set(x, getTerrainHeight(x, z), z);
    this._pickNewTarget();
    scene.add(this.group);
  }

  _randomPointInBounds() {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    return { x: minX + Math.random() * (maxX - minX), z: minZ + Math.random() * (maxZ - minZ) };
  }

  _pickNewTarget() {
    this.target = this._randomPointInBounds();
  }

  update(dt) {
    if (this.idleTime > 0) {
      this.idleTime -= dt;
      this.speed = damp(this.speed, 0, 8, dt);
    } else {
      const dx = this.target.x - this.group.position.x;
      const dz = this.target.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < ARRIVE_RADIUS) {
        if (Math.random() < IDLE_CHANCE) this.idleTime = 1 + Math.random() * 2;
        this._pickNewTarget();
      } else {
        const desiredHeading = Math.atan2(dx, dz);
        // Shortest angular distance, so the husky doesn't spin the long way around.
        let delta = desiredHeading - this.heading;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        this.heading += Math.sign(delta) * Math.min(Math.abs(delta), TURN_RATE * dt);
        this.speed = damp(this.speed, WALK_SPEED, 4, dt);
      }
    }

    this.group.position.x += Math.sin(this.heading) * this.speed * dt;
    this.group.position.z += Math.cos(this.heading) * this.speed * dt;
    this.group.position.y = getTerrainHeight(this.group.position.x, this.group.position.z);
    this.group.rotation.y = this.heading;

    const speed01 = this.speed / WALK_SPEED;
    this.animTime += dt * (5 + speed01 * 4);
    const swing = Math.sin(this.animTime) * 0.5 * speed01;
    this.legs.frontLeft.rotation.x = swing;
    this.legs.backRight.rotation.x = swing;
    this.legs.frontRight.rotation.x = -swing;
    this.legs.backLeft.rotation.x = -swing;
  }
}

// Spawns a small pack of huskies that wander a bounded area near the shop, each picking a new
// random destination whenever it arrives at (or gives up idling at) its current one.
export class HuskyPack {
  constructor(scene, { count = 4, bounds = { minX: -45, maxX: 45, minZ: 15, maxZ: 75 } } = {}) {
    this.huskies = Array.from({ length: count }, () => new Husky(scene, bounds));
  }

  update(dt) {
    for (const husky of this.huskies) husky.update(dt);
  }
}
