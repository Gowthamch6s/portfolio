import * as THREE from 'three';
import { buildAstronaut } from './Astronaut.js';

const WALK_SPEED = 6.5;
const TURN_RATE = 2.4;
const GRAVITY = 9;
const JUMP_SPEED = 6.5;
const STAND_HEIGHT = 0.02;

// Walks a character on the surface of a sphere (planet center assumed at
// world origin — the planet group is placed at (0,0,0) while in "walk
// mode" so this stays simple) instead of a flat XZ plane: "up" is always
// the radial direction from the center through the character, gravity pulls
// back toward the surface along that same radial line, and turning rotates
// the character's forward vector around that local up axis rather than
// around world Y.
export class CharacterController {
  constructor(scene, planetRadius) {
    const { group, headGroup, leftLeg, rightLeg, leftArm, rightArm } = buildAstronaut();
    this.mesh = group;
    this.headGroup = headGroup;
    this.legs = [leftLeg, rightLeg];
    this.arms = [leftArm, rightArm];
    scene.add(group);

    this.radius = planetRadius;
    this.up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(1, 0, 0);
    this.position = this.up.clone().multiplyScalar(planetRadius);
    this.heightVelocity = 0;
    this.height = STAND_HEIGHT;
    this.walkPhase = 0;

    this._syncMesh();
  }

  spawnAt(up) {
    this.up = up.clone().normalize();
    this.position = this.up.clone().multiplyScalar(this.radius);
    // pick a forward vector that's genuinely tangent to the sphere here
    const arbitrary = Math.abs(this.up.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    this.forward = arbitrary.clone().sub(this.up.clone().multiplyScalar(arbitrary.dot(this.up))).normalize();
    this.height = STAND_HEIGHT;
    this.heightVelocity = 0;
    this._syncMesh();
  }

  update(dt, input) {
    // recompute local up from current position (sphere may be walked all
    // the way around) and re-tangent the forward vector against drift
    this.up.copy(this.position).normalize();
    this.forward.sub(this.up.clone().multiplyScalar(this.forward.dot(this.up)));
    if (this.forward.lengthSq() < 0.0001) this.forward.set(1, 0, 0);
    this.forward.normalize();

    const right = new THREE.Vector3().crossVectors(this.forward, this.up).normalize();

    this.forward.applyAxisAngle(this.up, -input.turn * TURN_RATE * dt);
    right.crossVectors(this.forward, this.up).normalize();

    const move = input.forward * WALK_SPEED * dt;
    if (move !== 0) {
      this.position.add(this.forward.clone().multiplyScalar(move));
      this.walkPhase += dt * 9 * Math.sign(input.forward || 1);
    }
    // re-project onto the sphere shell (position always at radius+height
    // from center) — walking naturally curves around the surface this way
    this.position.setLength(this.radius);

    const grounded = this.height <= STAND_HEIGHT + 0.001;
    if (grounded && input.jump) {
      this.heightVelocity = JUMP_SPEED;
    }
    this.heightVelocity -= GRAVITY * dt;
    this.height += this.heightVelocity * dt;
    if (this.height < STAND_HEIGHT) {
      this.height = STAND_HEIGHT;
      this.heightVelocity = 0;
    }

    this._syncMesh(dt, Math.abs(input.forward), grounded);
  }

  _syncMesh(dt = 0, moveAmount = 0, grounded = true) {
    const worldPos = this.up.clone().multiplyScalar(this.radius + this.height);
    this.mesh.position.copy(worldPos);

    const right = new THREE.Vector3().crossVectors(this.forward, this.up).normalize();
    const m = new THREE.Matrix4().makeBasis(right, this.up, this.forward.clone().negate());
    this.mesh.quaternion.setFromRotationMatrix(m);

    if (moveAmount > 0.05 && grounded) {
      const swing = Math.sin(this.walkPhase) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.x = -swing * 0.7;
      this.arms[1].rotation.x = swing * 0.7;
    } else {
      this.legs[0].rotation.x *= 0.8;
      this.legs[1].rotation.x *= 0.8;
      this.arms[0].rotation.x *= 0.8;
      this.arms[1].rotation.x *= 0.8;
    }
  }
}
