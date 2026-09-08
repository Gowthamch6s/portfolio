import * as THREE from 'three';

// A small, friendly (not creepy) low-poly alien — bulbous head, big black
// almond eyes, thin limbs, a slender antenna. Color varies per instance so
// a planet's aliens read as a little population, not one clone repeated.
export function buildAlien(rand) {
  const skinColor = new THREE.Color().setHSL(0.32 + rand() * 0.35, 0.55, 0.5 + rand() * 0.15);
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.2 });

  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 4, 8), skinMat);
  body.position.y = 0.42;
  body.castShadow = true;
  group.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), skinMat);
  head.scale.set(0.85, 1.05, 0.95);
  head.castShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), eyeMat);
    eye.scale.set(0.7, 1.3, 1);
    eye.position.set(side * 0.09, -0.01, 0.14);
    eye.rotation.z = side * 0.3;
    headGroup.add(eye);
  }

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.16, 5), skinMat);
  antenna.position.set(0, 0.22, 0);
  antenna.rotation.z = 0.2;
  headGroup.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshStandardMaterial({ color: 0xaef0ff, emissive: 0xaef0ff, emissiveIntensity: 1.2 }));
  antennaTip.position.set(0.03, 0.3, 0);
  headGroup.add(antennaTip);

  group.add(headGroup);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.24, 4, 6), skinMat);
    arm.position.set(side * 0.14, 0.44, 0);
    arm.rotation.z = side * 0.35;
    group.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 6), skinMat);
    leg.position.set(side * 0.06, 0.14, 0);
    group.add(leg);
  }

  return { group, headGroup };
}
