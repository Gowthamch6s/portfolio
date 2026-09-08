import * as THREE from 'three';
import { buildAstronaut } from '../character/Astronaut.js';
import { buildAlien } from './Alien.js';
import { buildSpacePet } from './SpacePet.js';
import { FlatWanderer } from '../character/FlatWanderer.js';

// Some low-poly models' local origin doesn't sit exactly at their own feet
// (the astronaut's legs stop a bit short of y=0) — measure the real gap so
// NPCs plant their feet on the terrain instead of hovering/sinking.
function computeFootOffset(mesh) {
  mesh.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(mesh).min.y;
}

const NPC_SUIT_COLORS = [0xffd27a, 0x8b5cf6, 0x22d3ee, 0xf472b6, 0x4ade80];
const WANDER_SPEED = 2.6;
const WANDER_TURN_RATE = 2.2;
const ARRIVE_DIST = 1.2;

function makeRng(seedStr) {
  let seed = seedStr.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

class Patroller {
  constructor(mesh, centerX, centerZ, patrolRadius, rand, legs, footOffset = 0) {
    const startX = centerX + (rand() - 0.5) * patrolRadius;
    const startZ = centerZ + (rand() - 0.5) * patrolRadius;
    this.walker = new FlatWanderer(mesh, startX, startZ, footOffset);
    this.centerX = centerX;
    this.centerZ = centerZ;
    this.patrolRadius = patrolRadius;
    this.rand = rand;
    this.legs = legs;
    this.pickTarget();
    this.pauseTimer = rand() * 2;
  }

  pickTarget() {
    const a = this.rand() * Math.PI * 2;
    const r = this.rand() * this.patrolRadius;
    this.targetX = this.centerX + Math.cos(a) * r;
    this.targetZ = this.centerZ + Math.sin(a) * r;
  }

  update(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      this.walker.settle(dt);
      return;
    }
    const dist = this.walker.moveToward(this.targetX, this.targetZ, WANDER_SPEED, WANDER_TURN_RATE, dt);
    if (this.legs) {
      const swing = Math.sin(this.walker.walkPhase) * 0.5;
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
    }
    if (dist < ARRIVE_DIST) {
      this.pickTarget();
      this.pauseTimer = 1 + this.rand() * 3;
    }
  }
}

class FollowerPet {
  constructor(mesh, startX, startZ, footOffset = 0) {
    this.walker = new FlatWanderer(mesh, startX, startZ, footOffset);
    this.bob = Math.random() * 10;
  }

  update(dt, playerPosition) {
    this.bob += dt * 4;
    const dist = Math.hypot(playerPosition.x - this.walker.position.x, playerPosition.z - this.walker.position.z);
    if (dist > 3) {
      this.walker.moveToward(playerPosition.x, playerPosition.z, WANDER_SPEED * 1.7, WANDER_TURN_RATE * 1.4, dt);
    } else {
      this.walker.settle(dt);
    }
    this.walker.mesh.position.y += Math.abs(Math.sin(this.bob)) * 0.12;
  }
}

// Populates every district with a few wandering NPC astronauts and aliens
// (patrolling within that district's clearing) plus one space pet that
// follows the player everywhere across the whole world.
export function spawnLifeForms(scene, districts, spawnPos) {
  const patrollers = [];

  for (const district of districts) {
    const rand = makeRng(`life-${district.id}`);
    const { x: cx, z: cz } = district.position;
    const patrolRadius = district.clearRadius * 0.6;

    for (let i = 0; i < 2; i++) {
      const { group, leftLeg, rightLeg } = buildAstronaut({
        suitColor: NPC_SUIT_COLORS[Math.floor(rand() * NPC_SUIT_COLORS.length)],
        accentColor: 0x1c2530,
      });
      scene.add(group);
      patrollers.push(new Patroller(group, cx, cz, patrolRadius, rand, [leftLeg, rightLeg], computeFootOffset(group)));
    }
    for (let i = 0; i < 2; i++) {
      const { group } = buildAlien(rand);
      scene.add(group);
      patrollers.push(new Patroller(group, cx, cz, patrolRadius, rand, null, computeFootOffset(group)));
    }
  }

  const petRand = makeRng('pet');
  const { group: petGroup } = buildSpacePet(petRand);
  scene.add(petGroup);
  const pet = new FollowerPet(petGroup, spawnPos.x, spawnPos.z, computeFootOffset(petGroup));

  return {
    update(dt, playerPosition) {
      for (const p of patrollers) p.update(dt);
      pet.update(dt, playerPosition);
    },
  };
}
