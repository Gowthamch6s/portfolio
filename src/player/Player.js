import * as THREE from 'three';
import { getTerrainHeight, SLOPE_ANGLE, TERRAIN_WIDTH, TERRAIN_DEPTH } from '../terrain/Terrain.js';
import { buildSkierMesh } from './CharacterModel.js';
import { clamp, damp } from '../utils/mathUtils.js';

export const PlayerState = {
  WALKING: 'WALKING',
  BUYING_GEAR: 'BUYING_GEAR',
  SKIING: 'SKIING',
  DRIVING_ATV: 'DRIVING_ATV',
};

// +1 turns the character clockwise (viewed from above) when input.turn is +1 (D / Right).
// Flip to -1 if your convention for "heading" ends up feeling mirrored.
const TURN_DIRECTION = 1;

const WALK_ACCEL = 14;
const WALK_MAX_SPEED = 4.2;
const WALK_FRICTION = 8.5;
const WALK_TURN_RATE = 2.2;

const SKI_GRAVITY = 9.8;
// Tangential component of gravity along the incline (g*sinθ) — a constant downhill pull in
// -Z, independent of local terrain bumps. See the SLOPE_ANGLE comment in Terrain.js for why.
const SKI_DOWNHILL_ACCEL = SKI_GRAVITY * Math.sin(SLOPE_ANGLE);
const SKI_FRICTION = 0.35; // dramatically lower than walking friction
const SKI_MAX_SPEED = 24;
const SKI_TURN_RATE = 2.4; // rad/s at full stick input
const CARVE_SPEED_PENALTY = 0.9; // fraction of speed shed per second, scaled by turn sharpness
const CENTRIFUGAL_COEFF = 0.14;
const CARVE_SHARPNESS_THRESHOLD = 0.05;
const BRAKE_DECEL = 15; // extra deceleration on top of normal ski friction while actively braking
const BRAKE_MIN_SPEED = 1.5;
const CONTINUOUS_DUST_INTERVAL = 0.09; // seconds between light ambient powder emissions
const CONTINUOUS_DUST_MIN_SPEED = 1.2;

const ATV_ACCEL = 9;
const ATV_MAX_SPEED = 14;
const ATV_FRICTION = 7;
const ATV_TURN_RATE = 1.7;

// The terrain mesh is finite — stop the player a little short of its actual edge so they can
// never ski (or walk) off into empty space with no ground rendered beneath them.
const BOUNDARY_MARGIN = 15;
const MAX_X = TERRAIN_WIDTH / 2 - BOUNDARY_MARGIN;
const MIN_Z = -TERRAIN_DEPTH / 2 + BOUNDARY_MARGIN;
const MAX_Z = TERRAIN_DEPTH / 2 - BOUNDARY_MARGIN;

export class Player {
  constructor(scene) {
    this.state = PlayerState.WALKING;
    this.velocity = new THREE.Vector3();
    this.heading = Math.PI; // facing -Z (downhill) by default
    this.gear = { agility: 1, speedCap: 1 };
    this.walkSpeed01 = 0;
    this.skiSpeed = 0;
    this._animTime = 0;

    const { group, torso, leftLeg, rightLeg, leftArm, rightArm, leftSki, rightSki, leftPole, rightPole, hairStrands } =
      buildSkierMesh();
    this.mesh = group;
    this.torso = torso;
    this.limbs = { leftLeg, rightLeg, leftArm, rightArm };
    this.gearParts = { leftSki, rightSki, leftPole, rightPole };
    this.hairStrands = hairStrands;
    scene.add(this.mesh);

    // CameraDirector / SnowSpray subscribe to carve events without Player depending on them.
    this.onCarve = null;
  }

  spawnAt(x, z, heading = this.heading) {
    this.mesh.position.set(x, 0, z);
    this.heading = heading;
    this.velocity.set(0, 0, 0);
    this._snapToGround();
  }

  setState(next) {
    if (next === this.state) return;
    // Skis/poles only make sense off the ATV — swap them for a seated pose on the way in,
    // and hand them back on the way out.
    if (next === PlayerState.DRIVING_ATV) this._setGearVisible(false);
    else if (this.state === PlayerState.DRIVING_ATV) this._setGearVisible(true);
    this.state = next;
  }

  _setGearVisible(visible) {
    this.gearParts.leftSki.visible = visible;
    this.gearParts.rightSki.visible = visible;
    this.gearParts.leftPole.visible = visible;
    this.gearParts.rightPole.visible = visible;
  }

  get position() {
    return this.mesh.position;
  }

  update(dt, input) {
    switch (this.state) {
      case PlayerState.WALKING:
        this._updateWalking(dt, input);
        break;
      case PlayerState.SKIING:
        this._updateSkiing(dt, input);
        break;
      case PlayerState.DRIVING_ATV:
        this._updateATV(dt, input);
        break;
      case PlayerState.BUYING_GEAR:
        // Frozen in place while the shop overlay is open.
        break;
    }
  }

  _updateWalking(dt, input) {
    if (input.turn !== 0) this.heading -= input.turn * WALK_TURN_RATE * TURN_DIRECTION * dt;

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));

    if (input.forward !== 0) {
      this.velocity.addScaledVector(forward, input.forward * WALK_ACCEL * dt);
    }

    const speed = this.velocity.length();
    if (speed > WALK_MAX_SPEED) this.velocity.multiplyScalar(WALK_MAX_SPEED / speed);

    this._applyFriction(WALK_FRICTION * dt);

    this.mesh.position.addScaledVector(this.velocity, dt);
    this._clampToBounds();
    this._snapToGround();
    this.mesh.rotation.y = this.heading;
    this.mesh.rotation.z = damp(this.mesh.rotation.z, 0, 10, dt);

    this.walkSpeed01 = clamp(this.velocity.length() / WALK_MAX_SPEED, 0, 1);
    this._animateWalking(dt);
  }

  _updateSkiing(dt, input) {
    // Constant slope-aligned gravity, always pulling downhill along -Z.
    const slopeGravity = new THREE.Vector3(0, 0, -SKI_DOWNHILL_ACCEL);

    const turnRate = input.turn * SKI_TURN_RATE * TURN_DIRECTION * this.gear.agility;
    this.heading -= turnRate * dt;

    const speed = this.velocity.length();
    const sharpness = Math.abs(turnRate);

    if (sharpness > CARVE_SHARPNESS_THRESHOLD && speed > 0.4) {
      // Classic circular-motion approximation: centrifugal force is perpendicular to
      // velocity, scaled by v^2 and how hard we're turning.
      const velocityDir = this.velocity.clone().normalize();
      const sideways = new THREE.Vector3(velocityDir.z, 0, -velocityDir.x).multiplyScalar(Math.sign(turnRate));
      this.velocity.addScaledVector(sideways, speed * speed * CENTRIFUGAL_COEFF * dt);

      // Carving edges into the snow sheds forward speed proportional to how sharp the turn is.
      const speedLoss = clamp(sharpness * CARVE_SPEED_PENALTY * dt, 0, 1);
      this.velocity.multiplyScalar(1 - speedLoss);

      this.onCarve?.({ position: this.mesh.position, heading: this.heading, sharpness, speed });
    }

    // Braking (S): a hockey-stop — extra deceleration plus its own spray burst, independent
    // of whatever carve physics did above this frame.
    if (input.forward < 0 && speed > BRAKE_MIN_SPEED) {
      this._applyFriction(BRAKE_DECEL * dt);
      this.onCarve?.({ position: this.mesh.position, heading: this.heading, sharpness: 0.4, speed });
    }

    // Light continuous powder trail whenever moving at speed, independent of carving — real
    // skis kick up some snow even gliding in a straight line, not just while turning.
    this._dustTimer = (this._dustTimer ?? 0) + dt;
    if (this._dustTimer > CONTINUOUS_DUST_INTERVAL && speed > CONTINUOUS_DUST_MIN_SPEED) {
      this._dustTimer = 0;
      this.onCarve?.({ position: this.mesh.position, heading: this.heading, sharpness: 0, speed });
    }

    this.velocity.addScaledVector(slopeGravity, dt);

    this._applyFriction(SKI_FRICTION * dt * (0.4 + speed * 0.02));

    const cappedSpeed = SKI_MAX_SPEED * this.gear.speedCap;
    const finalSpeed = this.velocity.length();
    if (finalSpeed > cappedSpeed) this.velocity.multiplyScalar(cappedSpeed / finalSpeed);

    this.mesh.position.addScaledVector(this.velocity, dt);
    this._clampToBounds();
    this._snapToGround();

    // Visual lean into turns, independent of the physics heading.
    this.mesh.rotation.y = damp(this.mesh.rotation.y, this.heading, 10, dt);
    this.mesh.rotation.z = damp(this.mesh.rotation.z, clamp(-turnRate * 0.35, -0.5, 0.5), 8, dt);

    this.skiSpeed = this.velocity.length();
    this._animateSkiing(dt, turnRate);
  }

  // Simple wheeled-vehicle physics: forward/back accel along heading, steering turn rate,
  // friction — no slope gravity, since the ATV is meant for the flatter resort area, not the
  // steep run (nothing stops you driving it onto the slope, but it won't self-accelerate there).
  _updateATV(dt, input) {
    if (input.turn !== 0) this.heading -= input.turn * ATV_TURN_RATE * TURN_DIRECTION * dt;

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    if (input.forward !== 0) {
      this.velocity.addScaledVector(forward, input.forward * ATV_ACCEL * dt);
    }

    const speed = this.velocity.length();
    if (speed > ATV_MAX_SPEED) this.velocity.multiplyScalar(ATV_MAX_SPEED / speed);

    this._applyFriction(ATV_FRICTION * dt);

    this.mesh.position.addScaledVector(this.velocity, dt);
    this._clampToBounds();
    this._snapToGround();
    this.mesh.rotation.y = damp(this.mesh.rotation.y, this.heading, 12, dt);

    this.atvSpeed = this.velocity.length();
    this._animateATV(dt);
  }

  // Seated pose: legs bent forward onto the footwell, arms forward gripping the handlebar.
  _animateATV(dt) {
    this.limbs.leftLeg.rotation.x = damp(this.limbs.leftLeg.rotation.x, 1.3, 10, dt);
    this.limbs.rightLeg.rotation.x = damp(this.limbs.rightLeg.rotation.x, 1.3, 10, dt);
    this.limbs.leftArm.rotation.x = damp(this.limbs.leftArm.rotation.x, 1.1, 10, dt);
    this.limbs.rightArm.rotation.x = damp(this.limbs.rightArm.rotation.x, 1.1, 10, dt);
    this.limbs.leftArm.rotation.z = damp(this.limbs.leftArm.rotation.z, 0, 10, dt);
    this.limbs.rightArm.rotation.z = damp(this.limbs.rightArm.rotation.z, 0, 10, dt);

    this._animateHair(dt, 0.3 + Math.min(1, (this.atvSpeed ?? 0) / ATV_MAX_SPEED) * 0.8);
  }

  // Opposite-phase leg/arm swing, amplitude scaled by how fast the player is actually moving
  // so a barely-tapped key doesn't produce a full marching stride. When nearly stationary the
  // stride amplitude fades to ~0 and idle breathing/arm-sway fades in to fill the silence.
  _animateWalking(dt) {
    this._animTime += dt * (4 + this.walkSpeed01 * 6);
    const swing = Math.sin(this._animTime) * 0.5 * this.walkSpeed01;
    const idle = 1 - this.walkSpeed01;

    this.limbs.leftLeg.rotation.x = swing;
    this.limbs.rightLeg.rotation.x = -swing;
    this.limbs.leftArm.rotation.x = -swing * 0.7 + Math.sin(this._animTime * 0.5) * 0.05 * idle;
    this.limbs.rightArm.rotation.x = swing * 0.7 + Math.sin(this._animTime * 0.5 + Math.PI) * 0.05 * idle;

    this.torso.scale.y = 1 + Math.sin(this._animTime * 0.35) * 0.015 * idle;
    this._animateHair(dt, 0.15 + this.walkSpeed01 * 0.5);
  }

  // Skiing has no stride — settle into a tucked crouch with poles trailing, with a faint
  // idle sway so the pose doesn't look frozen during long straight runs.
  _animateSkiing(dt, turnRate) {
    this._animTime += dt * 2;
    const sway = Math.sin(this._animTime) * 0.04;

    this.limbs.leftLeg.rotation.x = damp(this.limbs.leftLeg.rotation.x, 0.32 + sway, 8, dt);
    this.limbs.rightLeg.rotation.x = damp(this.limbs.rightLeg.rotation.x, 0.32 - sway, 8, dt);
    this.limbs.leftArm.rotation.x = damp(this.limbs.leftArm.rotation.x, 0.75, 8, dt);
    this.limbs.rightArm.rotation.x = damp(this.limbs.rightArm.rotation.x, 0.75, 8, dt);

    // Weight shifts slightly into the turn — poles/legs lean opposite the carve direction.
    const lean = clamp(turnRate * 0.08, -0.2, 0.2);
    this.limbs.leftArm.rotation.z = damp(this.limbs.leftArm.rotation.z, lean, 8, dt);
    this.limbs.rightArm.rotation.z = damp(this.limbs.rightArm.rotation.z, lean, 8, dt);

    this._animateHair(dt, 0.5 + Math.min(1, this.skiSpeed / SKI_MAX_SPEED) * 1.4);
  }

  // Per-strand phase offset makes the hair ripple rather than swing as one rigid block;
  // amplitude scales with `intensity` so it flutters harder at ski speed than at a walk.
  _animateHair(dt, intensity) {
    this._hairTime = (this._hairTime ?? 0) + dt * (2 + intensity * 4);
    this.hairStrands.forEach((strand, i) => {
      strand.rotation.x = Math.sin(this._hairTime + i * 0.7) * 0.1 * (0.4 + intensity);
      strand.rotation.z = strand.userData.baseRotationZ + Math.cos(this._hairTime * 0.8 + i * 0.7) * 0.05 * intensity;
    });
  }

  _applyFriction(frictionMag) {
    const speed = this.velocity.length();
    if (speed > frictionMag) {
      this.velocity.addScaledVector(this.velocity, -frictionMag / speed);
    } else {
      this.velocity.set(0, this.velocity.y, 0);
    }
  }

  _snapToGround() {
    this.mesh.position.y = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
  }

  // Soft invisible wall at the edges of the generated mesh: clamp position and zero the
  // velocity component pushing further out, so hitting a boundary feels like a stop rather
  // than a teleport.
  _clampToBounds() {
    const pos = this.mesh.position;
    if (pos.x > MAX_X) {
      pos.x = MAX_X;
      if (this.velocity.x > 0) this.velocity.x = 0;
    } else if (pos.x < -MAX_X) {
      pos.x = -MAX_X;
      if (this.velocity.x < 0) this.velocity.x = 0;
    }

    if (pos.z > MAX_Z) {
      pos.z = MAX_Z;
      if (this.velocity.z > 0) this.velocity.z = 0;
    } else if (pos.z < MIN_Z) {
      pos.z = MIN_Z;
      if (this.velocity.z < 0) this.velocity.z = 0;
    }
  }
}
