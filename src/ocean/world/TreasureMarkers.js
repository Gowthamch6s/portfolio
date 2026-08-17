import * as THREE from 'three';

const chestMat = new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.6 });
const bandMat = new THREE.MeshStandardMaterial({ color: 0xd8b04a, roughness: 0.35, metalness: 0.6 });

function buildChest() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.0), chestMat);
  base.position.y = 0.45;
  base.castShadow = true;
  group.add(base);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.0, 12, 1, false, 0, Math.PI), chestMat);
  lid.rotation.z = Math.PI / 2;
  lid.scale.set(0.65, 1, 1);
  lid.position.set(0, 0.9, 0);
  lid.castShadow = true;
  group.add(lid);

  for (const y of [0.45, 0.9]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.1, 1.04), bandMat);
    band.position.y = y;
    group.add(band);
  }

  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.12), bandMat);
  lock.position.set(0, 0.55, 0.52);
  group.add(lock);

  return group;
}

// A treasure chest bobbing on a small floating platform, with a soft pulsing
// glow ring so it's findable but not shouting for attention the way a UI
// button would — this is the actual "explore to find it" object.
export class TreasureMarker {
  constructor(scene, data) {
    this.data = data;
    this.position = data.position;
    this.radius = data.radius;
    this.opened = false;

    const group = new THREE.Group();
    group.position.copy(data.position);
    scene.add(group);
    this.group = group;

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x6b5230, roughness: 0.8 }));
    platform.position.y = -0.05;
    group.add(platform);

    const chest = buildChest();
    chest.scale.setScalar(0.9);
    group.add(chest);
    this.chest = chest;

    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd76b, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.05;
    group.add(glowRing);
    this.glowRing = glowRing;

    const light = new THREE.PointLight(0xffd76b, 3, 14, 2);
    light.position.y = 1.5;
    group.add(light);
    this.light = light;

    this.clock = Math.random() * 10;
  }

  update(dt) {
    this.clock += dt;
    this.group.position.y = Math.sin(this.clock * 1.2) * 0.15;
    this.chest.rotation.y = this.clock * 0.15;
    const pulse = 0.4 + Math.sin(this.clock * 2.2) * 0.15;
    this.glowRing.material.opacity = this.opened ? 0.1 : pulse;
    this.glowRing.scale.setScalar(1 + Math.sin(this.clock * 2.2) * 0.06);
    this.light.intensity = this.opened ? 0.6 : 2.4 + Math.sin(this.clock * 2.2) * 0.6;
  }

  open() {
    this.opened = true;
  }
}

export function buildTreasureMarkers(scene, treasureData) {
  return treasureData.map((data) => new TreasureMarker(scene, data));
}
