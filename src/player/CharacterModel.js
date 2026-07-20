import * as THREE from 'three';

const MATERIALS = {
  jacket: new THREE.MeshStandardMaterial({ color: 0xd94a2b, roughness: 0.65 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x232a35, roughness: 0.7 }),
  boot: new THREE.MeshStandardMaterial({ color: 0x181414, roughness: 0.5 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xead9c4, roughness: 0.8 }),
  glove: new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.55 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2a1e17, roughness: 0.5 }),
  goggles: new THREE.MeshStandardMaterial({ color: 0x1a2733, roughness: 0.15, metalness: 0.6 }),
  ski: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.35, metalness: 0.25 }),
  pole: new THREE.MeshStandardMaterial({ color: 0xb9c0c6, roughness: 0.3, metalness: 0.6 }),
};

function mesh(geometry, material, castShadow = true) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = castShadow;
  return m;
}

// One leg: a hip pivot (for stride animation) containing the thigh/shin capsule and boot.
// The ski itself is NOT a child here — real skis stay flat on the snow regardless of how
// the leg swings, so it's attached straight to the root group instead (see buildSkierMesh).
function buildLeg(side) {
  const hipPivot = new THREE.Group();
  hipPivot.position.set(side * 0.16, 0.95, 0);

  const leg = mesh(new THREE.CapsuleGeometry(0.105, 0.44, 4, 6), MATERIALS.pants);
  leg.position.y = -0.34;
  hipPivot.add(leg);

  const boot = mesh(new THREE.BoxGeometry(0.19, 0.22, 0.36), MATERIALS.boot);
  boot.position.set(0, -0.66, 0.02);
  hipPivot.add(boot);

  return hipPivot;
}

// One arm: a shoulder pivot containing the upper arm, a gloved hand, and a ski pole angled
// down toward the snow — the small details that make the silhouette read as skiing, not
// walking.
function buildArm(side, jacketMaterial) {
  const shoulderPivot = new THREE.Group();
  shoulderPivot.position.set(side * 0.35, 1.62, 0);

  const arm = mesh(new THREE.CapsuleGeometry(0.085, 0.36, 4, 6), jacketMaterial);
  arm.position.y = -0.26;
  shoulderPivot.add(arm);

  const hand = mesh(new THREE.SphereGeometry(0.095, 10, 10), MATERIALS.glove);
  hand.position.y = -0.5;
  shoulderPivot.add(hand);

  const pole = mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.1, 6), MATERIALS.pole);
  pole.position.set(0, -0.98, 0.12);
  pole.rotation.x = 0.35;
  shoulderPivot.add(pole);

  return { pivot: shoulderPivot, pole };
}

// Builds a stylized low-poly human: head, torso, two arms with hands + poles, two legs with
// boots, and two independent skis. Returns the root group plus references to the animatable
// pivots so Player.js can drive a simple walk/ski stride each frame. Pass `jacketColor` to
// give NPC skiers visual variety instead of everyone sharing the player's exact red jacket.
export function buildSkierMesh({ jacketColor } = {}) {
  const group = new THREE.Group();
  const jacketMaterial = jacketColor
    ? new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.65 })
    : MATERIALS.jacket;

  const torso = mesh(new THREE.CapsuleGeometry(0.25, 0.5, 4, 8), jacketMaterial);
  torso.position.y = 1.35;
  group.add(torso);

  const head = mesh(new THREE.SphereGeometry(0.205, 14, 14), MATERIALS.skin);
  head.position.y = 1.95;
  group.add(head);

  // A proper knit beanie covering the whole crown — short-haired look, no loose strands.
  const beanie = mesh(new THREE.SphereGeometry(0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), MATERIALS.pants);
  beanie.position.y = 1.97;
  group.add(beanie);

  const goggles = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), MATERIALS.goggles);
  goggles.position.set(0, 1.96, 0.17);
  group.add(goggles);

  // No hair strands anymore — kept as an empty array so Player.js's hair sway loop is a no-op.
  const hairStrands = [];

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  group.add(leftLeg, rightLeg);

  const leftArmBuild = buildArm(-1, jacketMaterial);
  const rightArmBuild = buildArm(1, jacketMaterial);
  const leftArm = leftArmBuild.pivot;
  const rightArm = rightArmBuild.pivot;
  group.add(leftArm, rightArm);

  const leftSki = mesh(new THREE.BoxGeometry(0.16, 0.05, 1.9), MATERIALS.ski);
  leftSki.position.set(-0.16, 0.03, 0);
  const rightSki = mesh(new THREE.BoxGeometry(0.16, 0.05, 1.9), MATERIALS.ski);
  rightSki.position.set(0.16, 0.03, 0);
  group.add(leftSki, rightSki);

  return {
    group,
    torso,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    leftSki,
    rightSki,
    leftPole: leftArmBuild.pole,
    rightPole: rightArmBuild.pole,
    hairStrands,
  };
}
