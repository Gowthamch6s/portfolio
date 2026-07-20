import * as THREE from 'three';

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a6b2f, roughness: 0.55, metalness: 0.15 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 });
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.5 });
const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffe066, emissiveIntensity: 0.6 });

function wheel(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.34, z);

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), wheelMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 8), hubMat);
  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  return group;
}

// A small parked all-terrain vehicle: boxy chassis, seat, handlebar, headlight, and four
// independent wheel groups returned separately so the caller can spin them with speed.
export function buildATV() {
  const group = new THREE.Group();

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 1.95), bodyMat);
  chassis.position.y = 0.58;
  chassis.castShadow = true;
  group.add(chassis);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.65), seatMat);
  seat.position.set(0, 0.82, -0.15);
  seat.castShadow = true;
  group.add(seat);

  const frontRack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 0.5), bodyMat);
  frontRack.position.set(0, 0.62, 0.85);
  group.add(frontRack);

  const handleBar = new THREE.Group();
  handleBar.position.set(0, 0.95, 0.55);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 6), hubMat);
  bar.rotation.z = Math.PI / 2;
  handleBar.add(bar);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), hubMat);
  post.position.y = -0.15;
  handleBar.add(post);
  group.add(handleBar);

  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), lightMat);
  headlight.position.set(0, 0.62, 1.0);
  group.add(headlight);

  const wheels = {
    frontLeft: wheel(-0.52, 0.65),
    frontRight: wheel(0.52, 0.65),
    backLeft: wheel(-0.52, -0.7),
    backRight: wheel(0.52, -0.7),
  };
  Object.values(wheels).forEach((w) => group.add(w));

  return { group, wheels, seatPosition: new THREE.Vector3(0, 0.5, -0.15) };
}
