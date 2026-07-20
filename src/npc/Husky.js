import * as THREE from 'three';

const fur = new THREE.MeshStandardMaterial({ color: 0x74797e, roughness: 0.85 });
const furLight = new THREE.MeshStandardMaterial({ color: 0xf1f2f0, roughness: 0.85 });
const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6 });

function leg(x, z) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0.32, z);
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.3, 6), fur);
  upper.position.y = -0.15;
  upper.castShadow = true;
  pivot.add(upper);
  return pivot;
}

// Low-poly husky: horizontal body capsule, a head with snout/ears, an upswept tail, and four
// leg pivots for a simple diagonal trot. Returned legs let HuskyPack drive the walk cycle.
export function buildHuskyMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 4, 6), fur);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.34;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), furLight);
  chest.position.set(0, 0.3, -0.15);
  group.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), fur);
  head.position.set(0, 0.44, 0.34);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.2), furLight);
  snout.position.set(0, 0.4, 0.5);
  group.add(snout);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), dark);
  nose.position.set(0, 0.4, 0.6);
  group.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), fur);
    ear.position.set(side * 0.09, 0.58, 0.32);
    ear.rotation.x = -0.15;
    group.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), furLight);
  tail.position.set(0, 0.5, -0.42);
  tail.rotation.x = 2.3;
  group.add(tail);

  const legs = {
    frontLeft: leg(-0.11, 0.18),
    frontRight: leg(0.11, 0.18),
    backLeft: leg(-0.11, -0.18),
    backRight: leg(0.11, -0.18),
  };
  Object.values(legs).forEach((l) => group.add(l));

  return { group, legs };
}
