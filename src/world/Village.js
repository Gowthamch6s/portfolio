import * as THREE from 'three';
import { getTerrainHeight } from '../terrain/Terrain.js';
import { buildCabin, buildSignboard } from './Cabin.js';
import { buildArch } from './Arch.js';
import { EDUCATION, EXPERIENCE, PROJECTS, SKILLS_ARCH_TEXT, SKILLS_SUBTEXT } from './careerData.js';

const SIDE_OFFSET = 10;
const CABIN_DEPTH = 3.2;
const SIGN_DISTANCE = CABIN_DEPTH / 2 + 1.8; // how far in front of the cabin the sign stands

// All 9 buildings + the landmark arch are static and only 10 objects total, so unlike the
// ski-run holograms these were replacing, there's no lazy spawn/despawn needed — the whole
// village is just placed once, like the shop or cave entrances.
export function createVillage() {
  const group = new THREE.Group();
  const waypoints = [];
  let z = 0;
  let side = -1;

  const placeCabin = (data, category) => {
    const x = side * SIDE_OFFSET;
    const facing = side > 0 ? -Math.PI / 2.6 : Math.PI / 2.6; // angle inward, facing the run

    const cabin = buildCabin({ width: 4, depth: CABIN_DEPTH, height: 2.4 });
    cabin.position.set(x, getTerrainHeight(x, z), z);
    cabin.rotation.y = facing;
    group.add(cabin);

    // Grounded independently at its own world position rather than nested inside the cabin —
    // on sloped/noisy terrain the ground height several units away can differ meaningfully
    // from the cabin's own, and a rigid parent-child offset was sinking the sign into the snow.
    const signX = x + Math.sin(facing) * SIGN_DISTANCE;
    const signZ = z + Math.cos(facing) * SIGN_DISTANCE;
    const sign = buildSignboard(data);
    sign.position.set(signX, getTerrainHeight(signX, signZ), signZ);
    sign.rotation.y = facing;
    group.add(sign);

    waypoints.push({ x, z, label: data.title, category, color: data.accent });
    z -= 50;
    side *= -1;
  };

  for (const data of EDUCATION) placeCabin(data, 'education');
  for (const data of EXPERIENCE) placeCabin(data, 'experience');

  const arch = buildArch({ text: SKILLS_ARCH_TEXT, subtext: SKILLS_SUBTEXT });
  arch.position.set(0, getTerrainHeight(0, z), z);
  group.add(arch);
  waypoints.push({ x: 0, z, label: 'Skills & Expertise', category: 'arch', color: 0xffb347 });
  z -= 50;

  for (const data of PROJECTS) placeCabin(data, 'project');

  return { group, waypoints };
}
