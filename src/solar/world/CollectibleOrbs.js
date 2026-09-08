import * as THREE from 'three';
import { groundHeight } from './Terrain.js';

function makeRng(seedStr) {
  let seed = seedStr.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

const ORBS_PER_DISTRICT = 6;
const COLLECT_RADIUS = 1.6;

// Small floating "Data Orbs" scattered through each district's clearing —
// walk through one to collect it automatically, echoing the reference
// game's "gather orbs to power up the district" objective. Purely a
// progress/flavor layer on top of the real content monuments; doesn't gate
// them.
export function spawnCollectibleOrbs(scene, districts) {
  const orbs = [];
  const progress = {};

  for (const district of districts) {
    progress[district.id] = { collected: 0, total: ORBS_PER_DISTRICT };
    const rand = makeRng(`orbs-${district.id}`);
    const { x: cx, z: cz } = district.position;

    for (let i = 0; i < ORBS_PER_DISTRICT; i++) {
      const a = rand() * Math.PI * 2;
      const r = district.clearRadius * (0.2 + rand() * 0.55);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      const y = groundHeight(x, z, []) + 1.1;

      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 0),
        new THREE.MeshStandardMaterial({ color: district.color, emissive: district.color, emissiveIntensity: 2.2, roughness: 0.25 })
      );
      mesh.position.set(x, y, z);
      const light = new THREE.PointLight(district.color, 1.2, 5, 2);
      mesh.add(light);
      scene.add(mesh);

      orbs.push({ mesh, district, baseY: y, bob: rand() * Math.PI * 2, collected: false });
    }
  }

  return {
    progress,
    // Returns the district id of a newly-collected orb this frame, or null.
    update(dt, playerPosition) {
      let justCollected = null;
      for (const orb of orbs) {
        if (orb.collected) continue;
        orb.bob += dt * 2.2;
        orb.mesh.position.y = orb.baseY + Math.sin(orb.bob) * 0.18;
        orb.mesh.rotation.y += dt * 1.6;

        const d = Math.hypot(playerPosition.x - orb.mesh.position.x, playerPosition.z - orb.mesh.position.z);
        if (d < COLLECT_RADIUS) {
          orb.collected = true;
          orb.mesh.visible = false;
          progress[orb.district.id].collected++;
          justCollected = orb.district;
        }
      }
      return justCollected;
    },
  };
}
