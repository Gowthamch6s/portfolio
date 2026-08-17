import * as THREE from 'three';

const hullMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.35, metalness: 0.25 });
const hullAccentMat = new THREE.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.5, metalness: 0.3 });
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x8fd3ff,
  roughness: 0.05,
  metalness: 0,
  transmission: 0.85,
  transparent: true,
  opacity: 0.55,
});
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee5, roughness: 0.15, metalness: 0.9 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6 });
const lightMat = new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffcf6b, emissiveIntensity: 1.4 });

// Top-down hull silhouette: pointed bow at +Z, flared beam amidships, flat
// transom at -Z. Extruded downward to give the hull depth/draft.
function buildHull() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 3.4); // bow tip
  shape.quadraticCurveTo(1.05, 2.6, 1.15, 1.1);
  shape.quadraticCurveTo(1.25, -0.4, 1.05, -1.7);
  shape.lineTo(1.05, -2.1); // transom corner
  shape.lineTo(-1.05, -2.1);
  shape.lineTo(-1.05, -1.7);
  shape.quadraticCurveTo(-1.25, -0.4, -1.15, 1.1);
  shape.quadraticCurveTo(-1.05, 2.6, 0, 3.4);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.62, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.1, 0);
  const hull = new THREE.Mesh(geometry, hullMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  return hull;
}

function buildHullStripe() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 3.2);
  shape.quadraticCurveTo(0.92, 2.5, 1.01, 1.1);
  shape.quadraticCurveTo(1.1, -0.4, 0.92, -1.6);
  shape.lineTo(0.92, -1.85);
  shape.lineTo(-0.92, -1.85);
  shape.lineTo(-0.92, -1.6);
  shape.quadraticCurveTo(-1.1, -0.4, -1.01, 1.1);
  shape.quadraticCurveTo(-0.92, 2.5, 0, 3.2);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.05, 0);
  return new THREE.Mesh(geometry, hullAccentMat);
}

function buildConsole() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.35), hullMat);
  base.position.set(0, 0.55, 0.35);
  base.castShadow = true;
  group.add(base);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.42, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0a1a22, emissive: 0x1fd7e8, emissiveIntensity: 0.55, roughness: 0.3 })
  );
  screen.position.set(0, 0.68, 0.52);
  screen.rotation.x = -0.35;
  group.add(screen);

  const windshieldShape = new THREE.Shape();
  windshieldShape.moveTo(-1.0, 0);
  windshieldShape.lineTo(-0.75, 1.0);
  windshieldShape.lineTo(0.75, 1.0);
  windshieldShape.lineTo(1.0, 0);
  windshieldShape.lineTo(-1.0, 0);
  const windshieldGeo = new THREE.ExtrudeGeometry(windshieldShape, { depth: 0.04, bevelEnabled: false });
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.9, 0.68);
  windshield.rotation.x = Math.PI / 2 + 0.28;
  group.add(windshield);

  const frameGeo = new THREE.EdgesGeometry(windshieldGeo);
  const frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0x2b3138 }));
  frame.position.copy(windshield.position);
  frame.rotation.copy(windshield.rotation);
  group.add(frame);

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), chromeMat);
    post.position.set(side * 0.95, 0.9, 0.68);
    post.rotation.x = 0.28;
    group.add(post);
  }

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), chromeMat);
  wheel.position.set(0.4, 0.62, 0.55);
  wheel.rotation.x = Math.PI / 2.3;
  group.add(wheel);

  return group;
}

function buildSeats() {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.55), seatMat);
    seat.position.set(side * 0.55, 0.28, -0.6);
    seat.castShadow = true;
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.12), seatMat);
    back.position.set(side * 0.55, 0.5, -0.85);
    group.add(back);
  }
  return group;
}

function buildEngineCover() {
  const group = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.9), hullMat);
  cover.position.set(0, 0.35, -1.55);
  cover.castShadow = true;
  group.add(cover);

  for (const side of [-1, 1]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), lightMat);
    light.position.set(side * 1.0, 0.15, -2.0);
    group.add(light);
  }

  const outboard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.2), chromeMat);
  outboard.position.set(0, -0.15, -2.15);
  group.add(outboard);

  return { group, outboard };
}

// Builds the full boat: hull + console + seats + engine cover + bow/stern
// nav lights. Returns the root group plus references useful for animation
// (wake spawn point, outboard tilt for turning feedback).
export function buildBoat() {
  const group = new THREE.Group();

  group.add(buildHull());
  group.add(buildHullStripe());
  group.add(buildConsole());
  group.add(buildSeats());
  const { group: engineCover, outboard } = buildEngineCover();
  group.add(engineCover);

  const bowLight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff5a5a, emissive: 0xff2020, emissiveIntensity: 1.2 }));
  bowLight.position.set(-0.4, 0.3, 3.0);
  group.add(bowLight);
  const bowLightG = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0x6bff8a, emissive: 0x2bff5a, emissiveIntensity: 1.2 }));
  bowLightG.position.set(0.4, 0.3, 3.0);
  group.add(bowLightG);

  group.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = true;
  });

  return { group, outboard, wakePoint: new THREE.Vector3(0, -0.1, -2.3) };
}
