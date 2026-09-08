import * as THREE from 'three';
import { buildAstronaut, removeSpacesuit } from './Astronaut.js';
import { groundHeight } from '../world/Terrain.js';

const WALK_SPEED = 7;
const BOOST_MULT = 1.9;
const TURN_RATE = 2.6;
const GRAVITY = 20;
const JUMP_SPEED = 8;

// Standard flat-world third-person movement: WASD relative to a heading
// angle around world Y, jump/gravity along world Y, ground height read from
// the shared terrain heightmap so the character always follows the actual
// rolling ground instead of a flat plane. Much simpler than the tiny-planet
// sphere-gravity version this replaces — there's no "local up" to track.
export class WorldCharacterController {
  constructor(scene, flattenZones) {
    const astronaut = buildAstronaut();
    this.astronaut = astronaut;
    this.mesh = astronaut.group;
    this.legs = [astronaut.leftLeg, astronaut.rightLeg];
    this.arms = [astronaut.leftArm, astronaut.rightArm];
    scene.add(astronaut.group);

    this.flattenZones = flattenZones;
    this.position = new THREE.Vector3(0, 0, 0);
    this.heading = 0;
    this.verticalVelocity = 0;
    this.walkPhase = 0;
    this.grounded = true;
    this.landed = false;
  }

  // Called once, the moment the landing cinematic ends — swaps the
  // spacesuit for casual clothes now that the player is on solid ground.
  landOnPlanet() {
    if (this.landed) return;
    this.landed = true;
    removeSpacesuit(this.astronaut);
  }

  spawnAt(x, z) {
    this.position.set(x, groundHeight(x, z, this.flattenZones), z);
    this.verticalVelocity = 0;
    this._syncMesh(0, 0, true);
  }

  update(dt, input) {
    this.heading -= input.turn * TURN_RATE * dt;

    const speed = WALK_SPEED * (input.boost ? BOOST_MULT : 1);
    const dirX = Math.sin(this.heading);
    const dirZ = Math.cos(this.heading);
    const move = input.forward * speed * dt;
    this.position.x += dirX * move;
    this.position.z += dirZ * move;

    const groundY = groundHeight(this.position.x, this.position.z, this.flattenZones);
    this.grounded = this.position.y <= groundY + 0.05;
    if (this.grounded && input.jump) {
      this.verticalVelocity = JUMP_SPEED;
    }
    this.verticalVelocity -= GRAVITY * dt;
    this.position.y += this.verticalVelocity * dt;
    if (this.position.y < groundY) {
      this.position.y = groundY;
      this.verticalVelocity = 0;
    }

    if (move !== 0) this.walkPhase += dt * (input.boost ? 14 : 9) * Math.sign(input.forward || 1);
    this._syncMesh(dt, Math.abs(input.forward), this.grounded);
  }

  _syncMesh(dt, moveAmount, grounded) {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    if (moveAmount > 0.05 && grounded) {
      const swing = Math.sin(this.walkPhase) * 0.55;
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
