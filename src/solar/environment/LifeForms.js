import * as THREE from 'three';
import { buildAstronaut } from '../character/Astronaut.js';
import { buildAlien } from './Alien.js';
import { buildSpacePet } from './SpacePet.js';
import { SurfaceWanderer, randomSurfaceDir } from '../character/SurfaceWanderer.js';

const NPC_SUIT_COLORS = [0xffd27a, 0x8b5cf6, 0x22d3ee, 0xf472b6, 0x4ade80];
const WANDER_SPEED = 2.4;
const WANDER_TURN_RATE = 2.0;
const ARRIVE_ANGLE = 0.08; // radians — "close enough" to a wander target

class Wanderer {
  constructor(mesh, radius, startDir, rand, legs) {
    this.walker = new SurfaceWanderer(mesh, radius, startDir);
    this.rand = rand;
    this.legs = legs; // optional [leftLeg, rightLeg] pairs to swing while moving
    this.target = randomSurfaceDir(rand);
    this.pauseTimer = rand() * 2;
  }

  update(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      this.walker.settle(dt);
      return;
    }
    const remaining = this.walker.moveToward(this.target, WANDER_SPEED, WANDER_TURN_RATE, dt);
    if (this.legs) {
      const swing = Math.sin(this.walker.walkPhase) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
    }
    if (remaining < ARRIVE_ANGLE) {
      this.target = randomSurfaceDir(this.rand);
      this.pauseTimer = 1 + this.rand() * 3;
    }
  }
}

// The player's pet hops along behind them — idle-bobbing in place while
// close, hopping to catch up once the player gets more than a few units
// ahead, rather than patrolling a fixed route like the NPCs/aliens.
class FollowerPet {
  constructor(mesh, radius, startDir) {
    this.walker = new SurfaceWanderer(mesh, radius, startDir);
    this.bob = Math.random() * 10;
  }

  update(dt, playerPosition) {
    this.bob += dt * 4;
    const toPlayer = playerPosition.clone().sub(this.walker.position);
    const dist = toPlayer.length();
    if (dist > 3) {
      const targetDir = playerPosition.clone().normalize();
      this.walker.moveToward(targetDir, WANDER_SPEED * 1.6, WANDER_TURN_RATE * 1.4, dt);
    } else {
      this.walker.settle(dt);
    }
    this.walker.mesh.position.y += Math.abs(Math.sin(this.bob)) * 0.12;
  }
}

// Spawns a handful of NPC astronauts, aliens, and one space pet on a
// planet's surface, all using the shared sphere-tangent wander movement —
// populates the world with visible life instead of an empty walk.
export function spawnLifeForms(scene, radius, rand, spawnDir) {
  const wanderers = [];
  let petHandle = null;

  const npcCount = 3;
  for (let i = 0; i < npcCount; i++) {
    const { group, leftLeg, rightLeg } = buildAstronaut({
      suitColor: NPC_SUIT_COLORS[Math.floor(rand() * NPC_SUIT_COLORS.length)],
      accentColor: 0x1c2530,
    });
    scene.add(group);
    const startDir = randomSurfaceDir(rand);
    wanderers.push(new Wanderer(group, radius, startDir, rand, [leftLeg, rightLeg]));
  }

  const alienCount = 3;
  for (let i = 0; i < alienCount; i++) {
    const { group } = buildAlien(rand);
    scene.add(group);
    const startDir = randomSurfaceDir(rand);
    wanderers.push(new Wanderer(group, radius, startDir, rand, null));
  }

  const { group: petGroup } = buildSpacePet(rand);
  scene.add(petGroup);
  const petStartDir = spawnDir.clone();
  petHandle = new FollowerPet(petGroup, radius, petStartDir);

  return {
    update(dt, playerPosition) {
      for (const w of wanderers) w.update(dt);
      if (petHandle) petHandle.update(dt, playerPosition);
    },
  };
}
