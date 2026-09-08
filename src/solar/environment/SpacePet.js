import * as THREE from 'three';

// A tiny round companion critter — big eyes, stubby legs, a floating orb
// "tail" light — that hops along after the player instead of walking a
// fixed patrol like the aliens/NPCs.
export function buildSpacePet(rand) {
  const bodyColor = new THREE.Color().setHSL(rand(), 0.6, 0.62);
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.2 });

  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), bodyMat);
  body.position.y = 0.24;
  body.scale.set(1, 0.9, 1.05);
  body.castShadow = true;
  group.add(body);

  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), eyeWhiteMat);
    white.position.set(side * 0.09, 0.3, 0.17);
    group.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    pupil.position.set(side * 0.09, 0.3, 0.22);
    group.add(pupil);
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), bodyMat);
    leg.position.set(side * 0.1, 0.06, 0.05);
    group.add(leg);
  }

  const tailLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor, emissive: bodyColor, emissiveIntensity: 1.4 })
  );
  tailLight.position.set(0, 0.3, -0.2);
  group.add(tailLight);

  return { group };
}
