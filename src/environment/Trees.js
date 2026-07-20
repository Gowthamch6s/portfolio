import * as THREE from 'three';
import { getTerrainHeight } from '../terrain/Terrain.js';
import { scatterPositions } from './scatter.js';

// Three InstancedMeshes (trunk, foliage, snow cap) instead of N individual meshes — a forest
// of a few hundred trees this way costs 3 draw calls total, not a few hundred.
export function createForest({ count = 220, minX = -190, maxX = 190, minZ = -430, maxZ = 60 } = {}) {
  const group = new THREE.Group();
  const positions = scatterPositions(count, { minX, maxX, minZ, maxZ });
  const total = positions.length;

  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.12, 0.16, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 }),
    total
  );
  trunkMesh.castShadow = true;

  const foliageMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.1, 2.6, 7),
    new THREE.MeshStandardMaterial({ color: 0x2c4a34, roughness: 0.85 }),
    total
  );
  foliageMesh.castShadow = true;

  const snowCapMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.35, 0.6, 7),
    new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.6 }),
    total
  );

  const dummy = new THREE.Object3D();

  positions.forEach(({ x, z }, i) => {
    const groundY = getTerrainHeight(x, z);
    const scale = 0.7 + Math.random() * 0.8;
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(scale);

    dummy.position.set(x, groundY + 0.7 * scale, z);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, groundY + 1.9 * scale, z);
    dummy.updateMatrix();
    foliageMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, groundY + 3.15 * scale, z);
    dummy.updateMatrix();
    snowCapMesh.setMatrixAt(i, dummy.matrix);
  });

  group.add(trunkMesh, foliageMesh, snowCapMesh);
  return group;
}
