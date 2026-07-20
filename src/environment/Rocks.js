import * as THREE from 'three';
import { getTerrainHeight } from '../terrain/Terrain.js';
import { scatterPositions } from './scatter.js';

// Two InstancedMeshes (boulder body, snow dusting) — same reasoning as the forest: a field of
// a few hundred rocks costs 2 draw calls total, not a few hundred individual meshes.
export function createRockField({ count = 90, minX = -190, maxX = 190, minZ = -430, maxZ = 60 } = {}) {
  const group = new THREE.Group();
  const positions = scatterPositions(count, { minX, maxX, minZ, maxZ });
  const total = positions.length;

  const rockMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x5c5850, roughness: 0.95 }),
    total
  );
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;

  const snowCapMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.7 }),
    total
  );

  const dummy = new THREE.Object3D();

  positions.forEach(({ x, z }, i) => {
    const groundY = getTerrainHeight(x, z);
    const scale = 0.5 + Math.random() * 1.3;
    const rotY = Math.random() * Math.PI * 2;
    const rotX = (Math.random() - 0.5) * 0.6;
    const rotZ = (Math.random() - 0.5) * 0.6;

    // Non-uniform per-axis scale so instances read as irregular boulders, not perfect spheres.
    dummy.rotation.set(rotX, rotY, rotZ);
    dummy.scale.set(scale * (0.8 + Math.random() * 0.5), scale * (0.6 + Math.random() * 0.4), scale * (0.8 + Math.random() * 0.5));
    dummy.position.set(x, groundY + scale * 0.35, z);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(i, dummy.matrix);

    // A flattened cap sitting on the upper half, like accumulated snow rather than a full coat.
    dummy.scale.multiplyScalar(0.62);
    dummy.scale.y *= 0.5;
    dummy.position.y += scale * 0.42;
    dummy.updateMatrix();
    snowCapMesh.setMatrixAt(i, dummy.matrix);
  });

  group.add(rockMesh, snowCapMesh);
  return group;
}
