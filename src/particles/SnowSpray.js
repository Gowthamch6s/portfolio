import * as THREE from 'three';

const MAX_PARTICLES = 550; // headroom for the now-continuous ambient dust trail, not just carve bursts
const PARTICLE_GRAVITY = 6;
const PARK_DEPTH = -1000; // dead particles get parked far below the terrain, invisible

// A single pooled THREE.Points cloud reused for every carve — avoids allocating new
// geometry every time the player sprays powder while turning.
export class SnowSpray {
  constructor(scene) {
    this.maxParticles = MAX_PARTICLES;
    this.positions = new Float32Array(this.maxParticles * 3).fill(PARK_DEPTH);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.life = new Float32Array(this.maxParticles);
    this.cursor = 0;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);
  }

  spray({ position, heading, sharpness, speed }) {
    const count = Math.min(24, Math.round(sharpness * 30 + speed * 0.6));
    const behind = new THREE.Vector3(Math.sin(heading + Math.PI), 0, Math.cos(heading + Math.PI));
    const side = new THREE.Vector3(behind.z, 0, -behind.x);

    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.maxParticles;

      const spread = (Math.random() - 0.5) * 1.6;
      this.positions[idx * 3 + 0] = position.x + behind.x * 0.6 + side.x * spread;
      this.positions[idx * 3 + 1] = position.y + 0.2;
      this.positions[idx * 3 + 2] = position.z + behind.z * 0.6 + side.z * spread;

      const outward = 1.2 + Math.random() * 1.8;
      this.velocities[idx * 3 + 0] = side.x * spread * outward + behind.x * 1.5;
      this.velocities[idx * 3 + 1] = 2.2 + Math.random() * 2.2;
      this.velocities[idx * 3 + 2] = side.z * spread * outward + behind.z * 1.5;

      this.life[idx] = 0.5 + Math.random() * 0.4;
    }
  }

  update(dt) {
    const pos = this.positions;
    const vel = this.velocities;

    for (let i = 0; i < this.maxParticles; i++) {
      if (this.life[i] <= 0) continue;

      this.life[i] -= dt;
      vel[i * 3 + 1] -= PARTICLE_GRAVITY * dt;

      pos[i * 3 + 0] += vel[i * 3 + 0] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;

      if (this.life[i] <= 0) {
        pos[i * 3 + 1] = PARK_DEPTH;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
