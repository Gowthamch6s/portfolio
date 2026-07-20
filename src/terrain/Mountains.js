import * as THREE from 'three';
import { valueNoise2D } from '../utils/noise.js';
import { getFarTerrainHeight } from './Terrain.js';

// Purely decorative backdrop — a ring of jagged peaks far outside the playable terrain,
// fading into the existing fog/sky so the ski run doesn't feel like it's floating in a void.
// Not part of collision/physics: the player never reaches these, so no height-query needed.
function buildPeak({ radius, height, radialSegments, heightSegments, jitter, rockColor, snowColor, snowLine }) {
  const geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const rock = new THREE.Color(rockColor);
  const snow = new THREE.Color(snowColor);
  const mixed = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    // Jagged silhouette: displace outward proportional to height-so-far, using the same
    // hand-rolled value noise as the terrain so peaks read as rocky, not smooth cones. Skipped
    // for the coarse LOD level — a distant silhouette a few pixels tall doesn't need it.
    const heightFraction = 0.5 + y / height; // 0 at base, 1 at tip
    if (jitter) {
      const jitterAmount = (valueNoise2D(x * 0.5 + i, z * 0.5) - 0.5) * radius * 0.5 * (1 - heightFraction);
      const dir = Math.atan2(z, x);
      position.setX(i, x + Math.cos(dir) * jitterAmount);
      position.setZ(i, z + Math.sin(dir) * jitterAmount);
    }

    // Inverted from a typical snowcap: per the brief, rock exposed near the peak (too steep
    // and wind-scoured for snow to hold) with snowy lower slopes below the line.
    const rockAmount = THREE.MathUtils.smoothstep(heightFraction, snowLine - 0.15, snowLine + 0.1);
    mixed.copy(snow).lerp(rock, rockAmount);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, fog: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  return mesh;
}

const LOD_SWITCH_DISTANCE = 380;

export function createMountainRange({
  count = 36,
  innerRadius = 550,
  outerRadius = 1150,
  minHeight = 90,
  maxHeight = 420,
} = {}) {
  const group = new THREE.Group();
  const lods = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = innerRadius + Math.random() ** 1.5 * (outerRadius - innerRadius);
    const height = minHeight + Math.random() ** 1.3 * (maxHeight - minHeight);
    const radius = height * (0.5 + Math.random() * 0.5);
    const snowLine = 0.55 + Math.random() * 0.2;

    const highDetail = buildPeak({
      radius,
      height,
      radialSegments: 7,
      heightSegments: 6,
      jitter: true,
      rockColor: 0x5b5a63,
      snowColor: 0xf3f7ff,
      snowLine,
    });
    const lowDetail = buildPeak({
      radius,
      height,
      radialSegments: 5,
      heightSegments: 1,
      jitter: false,
      rockColor: 0x5b5a63,
      snowColor: 0xf3f7ff,
      snowLine,
    });

    // Distant peaks (this scene's whole point) rarely need their full jagged detail on
    // screen — LOD swaps to a ~6x-cheaper cone once the camera is far enough away.
    const lod = new THREE.LOD();
    lod.addLevel(highDetail, 0);
    lod.addLevel(lowDetail, LOD_SWITCH_DISTANCE);

    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    // Base sits on the (clamped) ground height, embedded slightly to hide the jittered base
    // rim — grounded exactly rather than floating at a guessed constant offset.
    const groundY = getFarTerrainHeight(x, z);
    lod.position.set(x, groundY + height / 2 - height * 0.05, z);
    lod.rotation.y = Math.random() * Math.PI * 2;

    group.add(lod);
    lods.push(lod);
  }

  group.userData.lods = lods;
  return group;
}

// THREE.LOD doesn't auto-update — each instance needs its distance-to-camera checked once a
// frame to pick the right detail level.
export function updateMountainLODs(mountainGroup, camera) {
  for (const lod of mountainGroup.userData.lods) lod.update(camera);
}
