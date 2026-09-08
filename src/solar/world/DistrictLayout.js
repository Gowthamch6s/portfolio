import { PLANETS as DISTRICT_DATA } from '../data/planetsData.js';

// Reworked from "planets in orbit" to districts laid out across ONE
// continuous world, matching the reference game's single connected map
// instead of separate small instances. `radius` here is the flattened
// clearing radius on the terrain, not an orbiting sphere's size.
export const SPAWN_POSITION = { x: 0, z: 0 };

const DISTRICT_POSITIONS = [
  { x: -55, z: -70 }, // Terra Academia
  { x: 70, z: -60 }, // Nebula Forge
  { x: -75, z: 40 }, // Ignis Works
  { x: 60, z: 75 }, // Aether Core
  { x: -20, z: 110 }, // Lumen Isle
  { x: 20, z: -130 }, // Signal Station
];

export const DISTRICTS = DISTRICT_DATA.map((data, i) => ({
  ...data,
  position: DISTRICT_POSITIONS[i],
  clearRadius: 26,
}));

// Flattened ground zones for the terrain builder: spawn plus every district.
export function buildFlattenZones() {
  const zones = [{ x: SPAWN_POSITION.x, z: SPAWN_POSITION.z, radius: 20, height: 0 }];
  for (const d of DISTRICTS) {
    zones.push({ x: d.position.x, z: d.position.z, radius: d.clearRadius, height: 0 });
  }
  return zones;
}
