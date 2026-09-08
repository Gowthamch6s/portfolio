import * as THREE from 'three';

const defaultMats = {
  suit: new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.55, metalness: 0.1 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xff5a4a, roughness: 0.5 }),
  visor: new THREE.MeshStandardMaterial({ color: 0x142033, roughness: 0.15, metalness: 0.4, emissive: 0x1fd7e8, emissiveIntensity: 0.25 }),
  pack: new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.5, metalness: 0.2 }),
};

function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
}

function buildLeg(side, mats) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.14, 0.82, 0);
  const thigh = mesh(new THREE.CapsuleGeometry(0.11, 0.34, 4, 8), mats.suit);
  thigh.position.y = -0.2;
  hip.add(thigh);
  const boot = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.26), mats.accent);
  boot.position.set(0, -0.46, 0.03);
  hip.add(boot);
  return hip;
}

function buildArm(side, mats) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.3, 1.42, 0);
  const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 8), mats.suit);
  arm.position.y = -0.22;
  shoulder.add(arm);
  const glove = mesh(new THREE.SphereGeometry(0.1, 10, 10), mats.accent);
  glove.position.y = -0.42;
  shoulder.add(glove);
  return shoulder;
}

// Low-poly astronaut: white/red spacesuit, glowing visor, backpack — the
// "man exploring the world" character walking planet surfaces. Pass
// `suitColor`/`accentColor` to get an independent recolored set of
// materials (used for NPC astronauts) instead of the player's shared
// default materials — recoloring in place would recolor every instance
// since they'd share the same material objects.
export function buildAstronaut({ suitColor, accentColor } = {}) {
  const mats =
    suitColor == null && accentColor == null
      ? defaultMats
      : {
          suit: new THREE.MeshStandardMaterial({ color: suitColor ?? 0xf0f2f5, roughness: 0.55, metalness: 0.1 }),
          accent: new THREE.MeshStandardMaterial({ color: accentColor ?? 0xff5a4a, roughness: 0.5 }),
          visor: defaultMats.visor,
          pack: defaultMats.pack,
        };

  const group = new THREE.Group();

  const torso = mesh(new THREE.CapsuleGeometry(0.24, 0.42, 4, 10), mats.suit);
  torso.position.y = 1.16;
  group.add(torso);

  const chestLight = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x1fd7e8, emissive: 0x1fd7e8, emissiveIntensity: 1.2 }));
  chestLight.position.set(0, 1.22, 0.24);
  group.add(chestLight);

  const backpack = mesh(new THREE.BoxGeometry(0.34, 0.5, 0.2), mats.pack);
  backpack.position.set(0, 1.18, -0.26);
  group.add(backpack);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);
  const helmet = mesh(new THREE.SphereGeometry(0.22, 16, 16), mats.suit);
  headGroup.add(helmet);
  const visor = mesh(new THREE.SphereGeometry(0.17, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), mats.visor);
  visor.position.set(0, -0.01, 0.07);
  visor.rotation.x = -0.15;
  headGroup.add(visor);
  group.add(headGroup);

  const leftLeg = buildLeg(-1, mats);
  const rightLeg = buildLeg(1, mats);
  group.add(leftLeg, rightLeg);

  const leftArm = buildArm(-1, mats);
  const rightArm = buildArm(1, mats);
  group.add(leftArm, rightArm);

  return { group, headGroup, leftLeg, rightLeg, leftArm, rightArm };
}
