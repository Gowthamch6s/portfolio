import * as THREE from 'three';

const MAX_PARTICLES = 300;
const PARK_Y = -500;

// Pooled foam-spray particles spawned continuously behind the boat's wake
// point, rate/spread scaled by speed — same "always have N slots, recycle
// instead of allocate" approach as the ski game's SnowSpray.
export class BoatWake {
  constructor(scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const ages = new Float32Array(MAX_PARTICLES).fill(999);
    for (let i = 0; i < MAX_PARTICLES; i++) positions[i * 3 + 1] = PARK_Y;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xe8f6fa,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);

    this.positions = positions;
    this.velocities = velocities;
    this.ages = ages;
    this.cursor = 0;
    this.spawnAccumulator = 0;
  }

  spawn(origin, boatHeading, speed01) {
    const count = Math.floor(2 + speed01 * 4);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const spread = (Math.random() - 0.5) * 1.6;
      const backDir = new THREE.Vector3(-Math.sin(boatHeading), 0, -Math.cos(boatHeading));
      const sideDir = new THREE.Vector3(backDir.z, 0, -backDir.x);
      const pos = origin.clone().add(sideDir.multiplyScalar(spread));
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = 0.05;
      this.positions[i * 3 + 2] = pos.z;
      this.velocities[i * 3] = backDir.x * (1 + speed01 * 2) + (Math.random() - 0.5) * 0.6;
      this.velocities[i * 3 + 1] = 0.4 + Math.random() * 0.5;
      this.velocities[i * 3 + 2] = backDir.z * (1 + speed01 * 2) + (Math.random() - 0.5) * 0.6;
      this.ages[i] = 0;
    }
  }

  update(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.ages[i] > 1.1) continue;
      this.ages[i] += dt;
      if (this.ages[i] > 1.1) {
        this.positions[i * 3 + 1] = PARK_Y;
        continue;
      }
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt - dt * 1.2;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
