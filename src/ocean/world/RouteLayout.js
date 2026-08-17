import * as THREE from 'three';
import { PROJECT_ISLANDS, TREASURES } from '../data/projectsData.js';

export const BOAT_SPAWN = new THREE.Vector3(0, 0, 40);

export const WHIRLPOOL_POSITION = new THREE.Vector3(10, 0, -150);
export const WHIRLPOOL_RADIUS = 22;

// Island world positions, winding left/right down the map — the route bends
// around the whirlpool sitting between islands 2 and 3, matching the
// reference image's "path must navigate around" obstacle placement.
const ISLAND_POSITIONS = [
  new THREE.Vector3(-60, 0, -40),
  new THREE.Vector3(70, 0, -110),
  new THREE.Vector3(-55, 0, -195),
  new THREE.Vector3(60, 0, -270),
  new THREE.Vector3(-40, 0, -350),
];

export const ISLANDS = PROJECT_ISLANDS.map((data, i) => ({
  ...data,
  position: ISLAND_POSITIONS[i],
  radius: 13 + (i % 3) * 2,
}));

// Small, deliberately off the main labeled route — you have to explore to
// find these, not just follow the glowing line.
export const TREASURE_MARKERS = [
  { ...TREASURES[0], position: new THREE.Vector3(-28, 0, 8), radius: 6 },
  { ...TREASURES[1], position: new THREE.Vector3(-95, 0, -385), radius: 6 },
];

// Waypoints for the glowing route curve: spawn → each island → a wide bend
// around the whirlpool → the rest of the islands. The whirlpool detour
// point is offset far enough from WHIRLPOOL_POSITION (beyond its radius)
// that the curve visibly arcs around it instead of cutting through.
export function buildRouteCurve() {
  const points = [
    BOAT_SPAWN.clone(),
    ISLAND_POSITIONS[0].clone(),
    ISLAND_POSITIONS[1].clone(),
    new THREE.Vector3(55, 0, -152), // detour point, well clear of the whirlpool
    ISLAND_POSITIONS[2].clone(),
    ISLAND_POSITIONS[3].clone(),
    ISLAND_POSITIONS[4].clone(),
  ];
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);
}
