import * as THREE from 'three';
import { groundHeight } from '../world/Terrain.js';

// Flat-world equivalent of the old sphere-tangent wander movement: standard
// ground-height-following walk toward a target (x,z), turning to face it.
export class FlatWanderer {
  // `footOffset` compensates for meshes whose local origin doesn't sit
  // exactly at their own feet (e.g. the astronaut model) — pass the mesh's
  // bounding-box min.y so it doesn't hover above/sink below the terrain.
  constructor(mesh, startX, startZ, footOffset = 0) {
    this.mesh = mesh;
    this.footOffset = footOffset;
    this.position = new THREE.Vector3(startX, groundHeight(startX, startZ, []) - footOffset, startZ);
    this.heading = Math.random() * Math.PI * 2;
    this.walkPhase = Math.random() * 10;
    this._sync();
  }

  moveToward(targetX, targetZ, speed, turnRate, dt) {
    const toX = targetX - this.position.x;
    const toZ = targetZ - this.position.z;
    const dist = Math.hypot(toX, toZ);
    if (dist > 0.05) {
      const targetHeading = Math.atan2(toX, toZ);
      let delta = targetHeading - this.heading;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.heading += THREE.MathUtils.clamp(delta, -turnRate * dt, turnRate * dt);
    }
    const move = speed * dt;
    this.position.x += Math.sin(this.heading) * move;
    this.position.z += Math.cos(this.heading) * move;
    this.position.y = groundHeight(this.position.x, this.position.z, []) - this.footOffset;
    this.walkPhase += dt * speed * 1.4;
    this._sync();
    return dist;
  }

  settle(dt) {
    this.walkPhase = THREE.MathUtils.damp(this.walkPhase, Math.round(this.walkPhase / Math.PI) * Math.PI, 6, dt);
    this._sync();
  }

  _sync() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
  }
}
