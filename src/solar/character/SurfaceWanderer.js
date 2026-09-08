import * as THREE from 'three';

// Shared sphere-surface movement primitive for every autonomous creature
// (NPC astronauts, aliens, pets) — the same tangent-plane approach as the
// player's CharacterController, but steered toward a target direction
// instead of keyboard input.
export class SurfaceWanderer {
  constructor(mesh, radius, startDir) {
    this.mesh = mesh;
    this.radius = radius;
    this.up = startDir.clone().normalize();
    this.position = this.up.clone().multiplyScalar(radius);
    const arbitrary = Math.abs(this.up.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    this.forward = arbitrary.clone().sub(this.up.clone().multiplyScalar(arbitrary.dot(this.up))).normalize();
    this.height = 0;
    this.walkPhase = Math.random() * 10;
  }

  // Steers `forward` toward `targetDir` (clamped by turnRate) and advances
  // along it at `speed`. Returns the current angular distance to the
  // target (in radians) so callers know when they've "arrived."
  moveToward(targetDir, speed, turnRate, dt) {
    this.up.copy(this.position).normalize();
    this.forward.sub(this.up.clone().multiplyScalar(this.forward.dot(this.up)));
    if (this.forward.lengthSq() < 1e-6) this.forward.set(1, 0, 0);
    this.forward.normalize();

    const toTarget = targetDir.clone().sub(this.up.clone().multiplyScalar(targetDir.dot(this.up)));
    let angleToTarget = 0;
    if (toTarget.lengthSq() > 1e-6) {
      toTarget.normalize();
      angleToTarget = Math.atan2(
        this.forward.clone().cross(toTarget).dot(this.up),
        this.forward.dot(toTarget)
      );
      const turn = THREE.MathUtils.clamp(angleToTarget, -turnRate * dt, turnRate * dt);
      this.forward.applyAxisAngle(this.up, turn);
    }

    this.position.add(this.forward.clone().multiplyScalar(speed * dt));
    this.position.setLength(this.radius);
    this.walkPhase += dt * speed * 1.4;
    this._sync();
    return this.up.angleTo(targetDir);
  }

  settle(dt) {
    this.walkPhase = THREE.MathUtils.damp(this.walkPhase, Math.round(this.walkPhase / Math.PI) * Math.PI, 6, dt);
    this._sync();
  }

  _sync() {
    const worldPos = this.up.clone().multiplyScalar(this.radius + this.height);
    this.mesh.position.copy(worldPos);
    const right = new THREE.Vector3().crossVectors(this.forward, this.up).normalize();
    const m = new THREE.Matrix4().makeBasis(right, this.up, this.forward.clone().negate());
    this.mesh.quaternion.setFromRotationMatrix(m);
  }
}

// A random direction on the sphere, biased away from the poles a touch so
// wanderers don't cluster at the exact spawn/skyline anchor points.
export function randomSurfaceDir(rand) {
  const y = (rand() - 0.5) * 1.5;
  const theta = rand() * Math.PI * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
}
