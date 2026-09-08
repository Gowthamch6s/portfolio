import * as THREE from 'three';

const defaultMats = {
  suit: new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.55, metalness: 0.1 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xff5a4a, roughness: 0.5 }),
  visor: new THREE.MeshStandardMaterial({ color: 0x142033, roughness: 0.15, metalness: 0.4, emissive: 0x1fd7e8, emissiveIntensity: 0.25 }),
  pack: new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.5, metalness: 0.2 }),
};

// Casual "landed on the planet" materials — a jacket + jeans look that
// replaces the spacesuit once the player touches down, so the character
// isn't stuck in a helmet while exploring a breathable world.
const civilianMats = {
  jacket: new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.7 }),
  jeans: new THREE.MeshStandardMaterial({ color: 0x33415c, roughness: 0.8 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.6 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe3ac82, roughness: 0.75 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.85 }),
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
  return { hip, thigh, boot };
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
  return { shoulder, arm, glove };
}

// Low-poly astronaut: white/red spacesuit, glowing visor, backpack — the
// "man exploring the world" character walking planet surfaces. Pass
// `suitColor`/`accentColor` to get an independent recolored set of
// materials (used for NPC astronauts) instead of the player's shared
// default materials — recoloring in place would recolor every instance
// since they'd share the same material objects.
//
// The returned object also carries everything `removeSpacesuit()` needs to
// swap the player from spacesuit to casual clothes in place once they land.
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

  // civilian head — a bare face + hair cap, hidden until the suit comes off
  const face = mesh(new THREE.SphereGeometry(0.16, 14, 14), civilianMats.skin);
  face.visible = false;
  headGroup.add(face);
  const hair = mesh(new THREE.SphereGeometry(0.165, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), civilianMats.hair);
  hair.position.y = 0.02;
  hair.visible = false;
  headGroup.add(hair);

  group.add(headGroup);

  const { hip: leftLeg, thigh: leftThigh, boot: leftBoot } = buildLeg(-1, mats);
  const { hip: rightLeg, thigh: rightThigh, boot: rightBoot } = buildLeg(1, mats);
  group.add(leftLeg, rightLeg);

  const { shoulder: leftArm, arm: leftArmMesh, glove: leftGlove } = buildArm(-1, mats);
  const { shoulder: rightArm, arm: rightArmMesh, glove: rightGlove } = buildArm(1, mats);
  group.add(leftArm, rightArm);

  return {
    group,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    // parts needed to swap materials/visibility when the suit comes off
    suitParts: { helmet, visor, backpack, chestLight },
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

// One-way transform: hides the helmet/visor/backpack/chest-light, reveals a
// bare head + hair, and recolors the suit body into a jacket/jeans look.
// Called once, right as the player touches down on the planet's surface.
export function removeSpacesuit(astronaut) {
  const { suitParts, civilianParts, limbMeshes } = astronaut;
  suitParts.helmet.visible = false;
  suitParts.visor.visible = false;
  suitParts.backpack.visible = false;
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
