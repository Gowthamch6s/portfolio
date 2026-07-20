import * as THREE from 'three';
import { buildSkierMesh } from '../player/CharacterModel.js';
import { getTerrainHeight, SLOPE_ANGLE, TERRAIN_WIDTH, TERRAIN_DEPTH } from '../terrain/Terrain.js';
import { clamp, damp } from '../utils/mathUtils.js';

const GRAVITY = 9.8;
const DOWNHILL_ACCEL = GRAVITY * Math.sin(SLOPE_ANGLE);
const FRICTION = 0.4;
const CORRIDOR_X = TERRAIN_WIDTH / 2 - 25;
const RESPAWN_MIN_Z = -TERRAIN_DEPTH / 2 + 60;

const JACKET_COLORS = [0x2f6fd9, 0xe0b23a, 0x3fae5c, 0x9c4fd6, 0x2fb8c4];

// A background skier with no player input: accelerates downhill under the same constant
// slope gravity as the player, wanders gently side to side for personality, and loops back
// to the top of the run once it nears the bottom — keeping the mountain populated indefinitely
// without an unbounded number of meshes ever accumulating.
export class NPCSkier {
  constructor(scene, spawnZRange) {
    const { group, leftLeg, rightLeg, leftArm, rightArm } = buildSkierMesh({
      jacketColor: JACKET_COLORS[Math.floor(Math.random() * JACKET_COLORS.length)],
    });
    this.mesh = group;
    this.limbs = { leftLeg, rightLeg, leftArm, rightArm };
    this.spawnZRange = spawnZRange;
    this.velocity = new THREE.Vector3();
    this.maxSpeed = 14 + Math.random() * 8;
    this.wobbleFreq = 0.4 + Math.random() * 0.5;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.animTime = Math.random() * 10;

    scene.add(this.mesh);
    this._respawnAtTop();
  }

  _respawnAtTop() {
    const [minZ, maxZ] = this.spawnZRange;
    const x = (Math.random() - 0.5) * 2 * CORRIDOR_X;
    const z = minZ + Math.random() * (maxZ - minZ);
    this.heading = Math.PI + (Math.random() - 0.5) * 0.4;
    this.velocity.set(0, 0, -2 - Math.random() * 3);
    this.mesh.position.set(x, getTerrainHeight(x, z), z);
  }

  update(dt) {
    this.heading = Math.PI + Math.sin(this.animTime * this.wobbleFreq + this.wobblePhase) * 0.35;
    this.animTime += dt;

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.velocity.addScaledVector(new THREE.Vector3(0, 0, -DOWNHILL_ACCEL), dt);

    // Gently steer velocity toward the wobbling heading rather than snapping to it, so turns
    // look carved rather than teleported.
    const targetVel = forward.multiplyScalar(this.velocity.length());
    this.velocity.lerp(targetVel, Math.min(1, dt * 2));

    const speed = this.velocity.length();
    const frictionMag = FRICTION * dt * (0.4 + speed * 0.02);
    if (speed > frictionMag) this.velocity.addScaledVector(this.velocity, -frictionMag / speed);

    const finalSpeed = this.velocity.length();
    if (finalSpeed > this.maxSpeed) this.velocity.multiplyScalar(this.maxSpeed / finalSpeed);

    this.mesh.position.addScaledVector(this.velocity, dt);
    this.mesh.position.x = clamp(this.mesh.position.x, -CORRIDOR_X, CORRIDOR_X);
    this.mesh.position.y = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
    this.mesh.rotation.y = damp(this.mesh.rotation.y, this.heading, 8, dt);

    this.limbs.leftLeg.rotation.x = 0.32;
    this.limbs.rightLeg.rotation.x = 0.32;
    this.limbs.leftArm.rotation.x = 0.75;
    this.limbs.rightArm.rotation.x = 0.75;

    if (this.mesh.position.z < RESPAWN_MIN_Z) this._respawnAtTop();
  }
}

// Manages a small field of NPC skiers so the run feels populated rather than solitary.
export class NPCSkierField {
  constructor(scene, { count = 6, spawnZRange = [10, 40] } = {}) {
    this.skiers = Array.from({ length: count }, () => new NPCSkier(scene, spawnZRange));
  }

  update(dt) {
    for (const skier of this.skiers) skier.update(dt);
  }
}
