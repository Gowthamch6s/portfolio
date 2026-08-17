import * as THREE from 'three';

const sandMat = new THREE.MeshStandardMaterial({ color: 0xe8d3a0, roughness: 0.95 });
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f8f4a, roughness: 0.85 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.8 });
const frondMat = new THREE.MeshStandardMaterial({ color: 0x2f9e4f, roughness: 0.7, side: THREE.DoubleSide });
const coconutMat = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.8 });

function buildPalmTree(seed) {
  const group = new THREE.Group();
  const height = 3.2 + (seed % 5) * 0.3;
  const lean = (((seed * 37) % 20) - 10) * 0.015;

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, height, 6), trunkMat);
  trunk.position.y = height / 2;
  trunk.rotation.z = lean;
  trunk.castShadow = true;
  group.add(trunk);

  const crownY = height * Math.cos(lean);
  const crownX = height * Math.sin(lean);
  const frondCount = 7;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2 + seed;
    const frondShape = new THREE.Shape();
    frondShape.moveTo(0, 0);
    frondShape.quadraticCurveTo(0.5, 0.15, 1.3, 0.05);
    frondShape.quadraticCurveTo(0.6, -0.05, 0, 0);
    const frondGeo = new THREE.ShapeGeometry(frondShape);
    const frond = new THREE.Mesh(frondGeo, frondMat);
    frond.position.set(crownX, crownY, 0);
    frond.rotation.y = angle;
    frond.rotation.x = -0.5 - Math.random() * 0.25;
    frond.castShadow = true;
    group.add(frond);
  }

  for (let i = 0; i < 3; i++) {
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), coconutMat);
    coconut.position.set(crownX + (Math.random() - 0.5) * 0.2, crownY - 0.15, (Math.random() - 0.5) * 0.2);
    group.add(coconut);
  }

  return group;
}

// One tropical island: rocky/grassy mound rising from the water, a sand
// ring at the waterline, and a scatter of palm trees. `radius` controls
// overall footprint; taller/rockier center vs. flat sandy edges.
export function buildIsland({ radius = 14, seed = 1, treeCount = 6 } = {}) {
  const group = new THREE.Group();

  const sand = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.08, 0.6, 20), sandMat);
  sand.position.y = -0.1;
  sand.receiveShadow = true;
  group.add(sand);

  const moundHeight = radius * 0.4;
  const mound = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.72, moundHeight, 16), grassMat);
  mound.position.y = moundHeight / 2 + 0.2;
  mound.castShadow = true;
  mound.receiveShadow = true;
  group.add(mound);

  // a few rock outcrops near the shoreline
  const rockCount = 3 + (seed % 3);
  for (let i = 0; i < rockCount; i++) {
    const a = (i / rockCount) * Math.PI * 2 + seed * 0.7;
    const r = radius * (0.75 + Math.random() * 0.25);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.5, 0), rockMat);
    rock.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    group.add(rock);
  }

  for (let i = 0; i < treeCount; i++) {
    const a = (i / treeCount) * Math.PI * 2 + seed * 1.3;
    const r = radius * (0.25 + Math.random() * 0.45);
    const tree = buildPalmTree(seed * 13 + i);
    tree.position.set(Math.cos(a) * r, moundHeight * 0.3 + 0.1, Math.sin(a) * r);
    tree.scale.setScalar(0.85 + Math.random() * 0.3);
    group.add(tree);
  }

  return group;
}
