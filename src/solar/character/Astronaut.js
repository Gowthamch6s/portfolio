import * as THREE from 'three';

const suitMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.55, metalness: 0.1 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0xff5a4a, roughness: 0.5 });
const visorMat = new THREE.MeshStandardMaterial({ color: 0x142033, roughness: 0.15, metalness: 0.4, emissive: 0x1fd7e8, emissiveIntensity: 0.25 });
const packMat = new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.5, metalness: 0.2 });

function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
}

function buildLeg(side) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.14, 0.82, 0);
  const thigh = mesh(new THREE.CapsuleGeometry(0.11, 0.34, 4, 8), suitMat);
  thigh.position.y = -0.2;
  hip.add(thigh);
  const boot = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.26), accentMat);
  boot.position.set(0, -0.46, 0.03);
  hip.add(boot);
  return hip;
}

function buildArm(side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.3, 1.42, 0);
  const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 8), suitMat);
  arm.position.y = -0.22;
  shoulder.add(arm);
  const glove = mesh(new THREE.SphereGeometry(0.1, 10, 10), accentMat);
  glove.position.y = -0.42;
  shoulder.add(glove);
  return shoulder;
}

// Low-poly astronaut: white/red spacesuit, glowing visor, backpack — the
// "man exploring the world" character walking planet surfaces.
export function buildAstronaut() {
  const group = new THREE.Group();

  const torso = mesh(new THREE.CapsuleGeometry(0.24, 0.42, 4, 10), suitMat);
  torso.position.y = 1.16;
  group.add(torso);

  const chestLight = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x1fd7e8, emissive: 0x1fd7e8, emissiveIntensity: 1.2 }));
  chestLight.position.set(0, 1.22, 0.24);
  group.add(chestLight);

  const backpack = mesh(new THREE.BoxGeometry(0.34, 0.5, 0.2), packMat);
  backpack.position.set(0, 1.18, -0.26);
  group.add(backpack);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);
  const helmet = mesh(new THREE.SphereGeometry(0.22, 16, 16), suitMat);
  headGroup.add(helmet);
  const visor = mesh(new THREE.SphereGeometry(0.17, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), visorMat);
  visor.position.set(0, -0.01, 0.07);
  visor.rotation.x = -0.15;
  headGroup.add(visor);
  group.add(headGroup);

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  group.add(leftLeg, rightLeg);

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  group.add(leftArm, rightArm);

  return { group, headGroup, leftLeg, rightLeg, leftArm, rightArm };
}
