import * as THREE from 'three';
import { clamp, damp } from '../../utils/mathUtils.js';
import { buildBoat } from './Boat.js';

const ACCEL = 9;
const REVERSE_ACCEL = 5;
const MAX_SPEED = 26;
const MAX_REVERSE_SPEED = 8;
const WATER_DRAG = 3.2; // constant drag toward 0 — makes the boat coast to a stop, not brake instantly
const TURN_RATE = 1.7; // rad/s at full speed
const MIN_TURN_SPEED_FACTOR = 0.18; // boats barely steer sitting still — needs some speed to bite

const WORLD_HALF = 2600; // soft boundary — ocean plane is much bigger than the playable route

export class BoatController {
  constructor(scene) {
    const { group, outboard, wakePoint } = buildBoat();
    this.mesh = group;
    this.outboard = outboard;
    this.wakePoint = wakePoint;
    scene.add(group);

    this.position = new THREE.Vector3(0, 0, 40);
    this.heading = Math.PI; // facing -Z, out toward the route
    this.speed = 0;
    this.turnInput = 0;
    this.clock = 0;

    this.whirlpoolPull = new THREE.Vector3();
    this.inWhirlpool = false;

    this._syncMesh();
  }

  // A whirlpool applies an inward + tangential force to anything inside its
  // influence radius — the player must throttle hard to break free rather
  // than just drifting past, which is what makes it read as an obstacle to
  // steer around rather than decoration.
  applyWhirlpool(center, radius, strength) {
    const toCenter = new THREE.Vector2(center.x - this.position.x, center.z - this.position.z);
    const dist = toCenter.length();
    if (dist > radius || dist < 0.001) {
      this.inWhirlpool = false;
      return;
    }
    this.inWhirlpool = true;
    const falloff = 1 - dist / radius;
    toCenter.normalize();
    const tangent = new THREE.Vector2(-toCenter.y, toCenter.x);
    const pull = strength * falloff * falloff;
    this.whirlpoolPull.set(
      toCenter.x * pull * 0.6 + tangent.x * pull,
      0,
      toCenter.y * pull * 0.6 + tangent.y * pull
    );
  }

  update(dt, input) {
    this.clock += dt;

    const forward = input.forward;
    if (forward > 0) {
      this.speed += ACCEL * dt;
    } else if (forward < 0) {
      this.speed -= REVERSE_ACCEL * dt;
    } else {
      this.speed -= Math.sign(this.speed) * WATER_DRAG * dt;
      if (Math.abs(this.speed) < WATER_DRAG * dt) this.speed = 0;
    }
    this.speed = clamp(this.speed, -MAX_REVERSE_SPEED, MAX_SPEED);

    const speed01 = Math.abs(this.speed) / MAX_SPEED;
    const turnAvailable = MIN_TURN_SPEED_FACTOR + speed01 * (1 - MIN_TURN_SPEED_FACTOR);
    this.turnInput = damp(this.turnInput, input.turn, 8, dt);
    const turnDir = this.speed < 0 ? -1 : 1; // reversing flips steering, like a real boat
    this.heading += this.turnInput * TURN_RATE * turnAvailable * turnDir * dt;

    const dirX = Math.sin(this.heading);
    const dirZ = Math.cos(this.heading);
    this.position.x += dirX * this.speed * dt;
    this.position.z += dirZ * this.speed * dt;

    if (this.whirlpoolPull.lengthSq() > 0) {
      this.position.x += this.whirlpoolPull.x * dt;
      this.position.z += this.whirlpoolPull.z * dt;
      this.heading += this.whirlpoolPull.length() * 0.02 * dt;
      this.whirlpoolPull.set(0, 0, 0);
    }

    this.position.x = clamp(this.position.x, -WORLD_HALF, WORLD_HALF);
    this.position.z = clamp(this.position.z, -WORLD_HALF, WORLD_HALF);

    this._syncMesh(dt, speed01, forward);
  }

  _syncMesh(dt = 0, speed01 = 0, forward = 0) {
    const bobY = Math.sin(this.clock * 1.4 + this.position.x * 0.02) * 0.12
      + Math.sin(this.clock * 2.3 + this.position.z * 0.015) * 0.05;
    const targetY = bobY - Math.min(0.35, speed01 * 0.3); // squats slightly at speed, like a planing hull

    this.mesh.position.set(this.position.x, this.mesh.position.y ? damp(this.mesh.position.y, targetY, 6, dt || 1 / 60) : targetY, this.position.z);
    this.mesh.rotation.y = this.heading;

    const targetPitch = -speed01 * 0.14 * Math.sign(forward || 1) + Math.sin(this.clock * 1.7) * 0.015;
    const targetRoll = -this.turnInput * 0.22;
    this.mesh.rotation.x = damp(this.mesh.rotation.x || 0, targetPitch, 5, dt || 1 / 60);
    this.mesh.rotation.z = damp(this.mesh.rotation.z || 0, targetRoll, 6, dt || 1 / 60);

    if (this.outboard) {
      this.outboard.rotation.y = damp(this.outboard.rotation.y || 0, -this.turnInput * 0.5, 8, dt || 1 / 60);
    }
  }

  getWakeWorldPosition() {
    return this.mesh.localToWorld(this.wakePoint.clone());
  }
}
