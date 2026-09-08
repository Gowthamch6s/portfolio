import * as THREE from 'three';

// Blocky "voxel avatar" proportions — box head + hair cap, box torso, box
// limbs — matching the reference game's character style instead of the
// earlier rounded low-poly astronaut.
const HIP_Y = 0.55;
const LEG_H = 0.55;
const TORSO_H = 0.62;
const SHOULDER_Y = 1.05;
const ARM_H = 0.5;
const HEAD_H = 0.4;

const defaultMats = {
  suit: new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.55, metalness: 0.1 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xff5a4a, roughness: 0.5 }),
  visor: new THREE.MeshStandardMaterial({ color: 0x142033, roughness: 0.15, metalness: 0.4, emissive: 0x1fd7e8, emissiveIntensity: 0.25 }),
  helmetShell: new THREE.MeshStandardMaterial({ color: 0xe7ebef, roughness: 0.4, metalness: 0.15 }),
};

// Casual "landed on the planet" materials — a jacket + jeans look that
// replaces the spacesuit once the player touches down.
const civilianMats = {
  jacket: new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.7 }),
  jeans: new THREE.MeshStandardMaterial({ color: 0x33415c, roughness: 0.8 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.6 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe3ac82, roughness: 0.75 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.85 }),
};

function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  return m;
}

function buildLeg(side, mats) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.13, HIP_Y, 0);
  const leg = box(0.22, LEG_H, 0.26, mats.suit);
  leg.position.y = -LEG_H / 2;
  hip.add(leg);
  const shoe = box(0.24, 0.1, 0.3, mats.accent);
  shoe.position.set(0, -LEG_H + 0.02, 0.03);
  hip.add(shoe);
  return { hip, leg, shoe };
}

function buildArm(side, mats) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.31, SHOULDER_Y, 0);
  const arm = box(0.2, ARM_H, 0.2, mats.suit);
  arm.position.y = -ARM_H / 2;
  shoulder.add(arm);
  const hand = box(0.16, 0.14, 0.16, mats.accent);
  hand.position.y = -ARM_H;
  shoulder.add(hand);
  return { shoulder, arm, hand };
}

// Blocky voxel-avatar character used for both the player and every NPC
// (recolored via `suitColor`/`accentColor`). Returns everything
// `removeSpacesuit()` needs to swap from spacesuit to casual clothes once
// the player lands.
export function buildAstronaut({ suitColor, accentColor } = {}) {
  const mats =
    suitColor == null && accentColor == null
      ? defaultMats
      : {
          suit: new THREE.MeshStandardMaterial({ color: suitColor ?? 0xf0f2f5, roughness: 0.55, metalness: 0.1 }),
          accent: new THREE.MeshStandardMaterial({ color: accentColor ?? 0xff5a4a, roughness: 0.5 }),
          visor: defaultMats.visor,
          helmetShell: defaultMats.helmetShell,
        };

  const group = new THREE.Group();

  const torso = box(0.5, TORSO_H, 0.28, mats.suit);
  torso.position.y = HIP_Y + TORSO_H / 2;
  group.add(torso);

  const chestLight = box(0.14, 0.08, 0.03, new THREE.MeshStandardMaterial({ color: 0x1fd7e8, emissive: 0x1fd7e8, emissiveIntensity: 1.2 }));
  chestLight.position.set(0, HIP_Y + TORSO_H - 0.15, 0.155);
  group.add(chestLight);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, HIP_Y + TORSO_H + 0.05 + HEAD_H / 2, 0);
  group.add(headGroup);

  // spacesuit helmet — a boxy shell fully enclosing the head, with a visor
  const helmet = box(0.46, 0.46, 0.46, mats.helmetShell);
  headGroup.add(helmet);
  const visor = box(0.3, 0.2, 0.05, mats.visor);
  visor.position.set(0, -0.02, 0.21);
  headGroup.add(visor);

  // civilian head — face + hair cap, hidden until the suit comes off
  const face = box(HEAD_H, HEAD_H, HEAD_H, civilianMats.skin);
  face.visible = false;
  headGroup.add(face);
  const hair = box(HEAD_H + 0.02, HEAD_H * 0.42, HEAD_H + 0.02, civilianMats.hair);
  hair.position.y = HEAD_H / 2 - HEAD_H * 0.21 + 0.02;
  hair.visible = false;
  headGroup.add(hair);

  const { hip: leftLeg, leg: leftThigh, shoe: leftBoot } = buildLeg(-1, mats);
  const { hip: rightLeg, leg: rightThigh, shoe: rightBoot } = buildLeg(1, mats);
  group.add(leftLeg, rightLeg);

  const { shoulder: leftArm, arm: leftArmMesh, hand: leftGlove } = buildArm(-1, mats);
  const { shoulder: rightArm, arm: rightArmMesh, hand: rightGlove } = buildArm(1, mats);
  group.add(leftArm, rightArm);

  return {
    group,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    // parts needed to swap materials/visibility when the suit comes off
    suitParts: { helmet, visor, chestLight },
    civilianParts: { face, hair },
    limbMeshes: {
      torso,
      leftThigh,
      rightThigh,
      leftBoot,
      rightBoot,
      leftArm: leftArmMesh,
      rightArm: rightArmMesh,
      leftGlove,
      rightGlove,
    },
  };
}

// One-way transform: hides the helmet/visor/chest-light, reveals a bare
// head + hair, and recolors the suit body into a jacket/jeans look. Called
// once, right as the player touches down on the planet's surface.
export function removeSpacesuit(astronaut) {
  const { suitParts, civilianParts, limbMeshes } = astronaut;
  suitParts.helmet.visible = false;
  suitParts.visor.visible = false;
  suitParts.chestLight.visible = false;
  civilianParts.face.visible = true;
  civilianParts.hair.visible = true;

  limbMeshes.torso.material = civilianMats.jacket;
  limbMeshes.leftArm.material = civilianMats.jacket;
  limbMeshes.rightArm.material = civilianMats.jacket;
  limbMeshes.leftGlove.material = civilianMats.skin;
  limbMeshes.rightGlove.material = civilianMats.skin;
  limbMeshes.leftThigh.material = civilianMats.jeans;
  limbMeshes.rightThigh.material = civilianMats.jeans;
  limbMeshes.leftBoot.material = civilianMats.shoe;
  limbMeshes.rightBoot.material = civilianMats.shoe;
}
