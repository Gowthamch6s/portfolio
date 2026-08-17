import * as THREE from 'three';

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6b78, roughness: 0.35, metalness: 0.1 });
const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd8e6ea, roughness: 0.4 });

function buildDolphinMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.5, 6, 10), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.3, 4, 8), bellyMat);
  belly.rotation.z = Math.PI / 2;
  belly.position.y = -0.14;
  belly.scale.set(1, 0.7, 0.9);
  group.add(belly);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 8), bodyMat);
  snout.rotation.z = -Math.PI / 2;
  snout.position.set(0, -0.02, 1.0);
  group.add(snout);

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 4), bodyMat);
  dorsal.position.set(0, 0.4, -0.1);
  dorsal.rotation.y = Math.PI / 4;
  group.add(dorsal);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.15, 4), bodyMat);
  tail.rotation.x = Math.PI / 2;
  tail.rotation.z = Math.PI / 4;
  tail.scale.set(1.6, 1, 0.35);
  tail.position.set(0, 0, -1.05);
  group.add(tail);

  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), bodyMat);
    fin.rotation.z = side * 1.1;
    fin.position.set(side * 0.28, -0.1, 0.35);
    group.add(fin);
  }

  return group;
}

const LEAP_DURATION = 1.6;
const SWIM_SPEED = 9;

class Dolphin {
  constructor(scene, laneOffset, phase) {
    this.mesh = buildDolphinMesh();
    scene.add(this.mesh);
    this.laneOffset = laneOffset;
    this.phase = phase;
    this.progress = phase;
  }

  update(dt, boatPosition, boatHeading, dayNightFactor) {
    this.progress += dt / (LEAP_DURATION * 2);
    const t = this.progress % 1;

    // swims a lazy course roughly alongside the boat, offset to one side
    const forwardDir = new THREE.Vector3(Math.sin(boatHeading), 0, Math.cos(boatHeading));
    const sideDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x);
    const along = ((performance.now() * 0.001 * SWIM_SPEED + this.phase * 30) % 60) - 30;
    const base = boatPosition.clone()
      .add(forwardDir.clone().multiplyScalar(along))
      .add(sideDir.clone().multiplyScalar(this.laneOffset));

    // leap arc for the first half of the cycle, swim just under the surface otherwise
    let y = -0.3;
    let pitch = 0;
    if (t < 0.5) {
      const leapT = t / 0.5;
      y = Math.sin(leapT * Math.PI) * 2.2 - 0.3;
      pitch = Math.cos(leapT * Math.PI) * 0.6;
    }

    this.mesh.position.set(base.x, y, base.z);
    this.mesh.rotation.y = Math.atan2(forwardDir.x, forwardDir.z);
    this.mesh.rotation.x = pitch;

    const emissive = dayNightFactor * 0.5;
    this.mesh.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.emissive = obj.material.emissive || new THREE.Color();
        obj.material.emissive.setRGB(emissive * 0.5, emissive * 0.6, emissive * 0.8);
      }
    });
  }
}

export class DolphinPod {
  constructor(scene, count = 6) {
    this.dolphins = [];
    for (let i = 0; i < count; i++) {
      const laneOffset = (i % 2 === 0 ? 1 : -1) * (8 + Math.floor(i / 2) * 5);
      this.dolphins.push(new Dolphin(scene, laneOffset, i / count));
    }
  }

  update(dt, boatPosition, boatHeading, dayNightFactor) {
    for (const d of this.dolphins) d.update(dt, boatPosition, boatHeading, dayNightFactor);
  }
}
