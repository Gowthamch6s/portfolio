import * as THREE from 'three';
import './style.css';
import { createRenderer, createCamera, setupResize, createStarfield } from './core/SceneSetup.js';
import { buildSolarSystem, updateSolarSystem } from './map/SolarSystemScene.js';
import { buildTinyPlanet, decoratePlanet, placeContentNodes } from './planet/TinyPlanetWorld.js';
import { spawnLifeForms } from './environment/LifeForms.js';
import { CharacterController } from './character/CharacterController.js';
import { PlanetCamera } from './character/PlanetCamera.js';
import { HUD } from './ui/HUD.js';
import { SolarAudio } from './audio/SolarAudio.js';
import { InputManager } from '../input/InputManager.js';
import { PLANETS } from './data/planetsData.js';

const canvas = document.createElement('canvas');
canvas.id = 'scene';
document.getElementById('app').appendChild(canvas);

// Where the character always lands on a planet, and where the road/node
// placement anchor themselves relative to — kept slightly off the exact
// pole so the tangent-frame math in CharacterController never degenerates.
const SPAWN_DIR = new THREE.Vector3(0, 1, 0.05).normalize();

const renderer = createRenderer(canvas);
const camera = createCamera();
setupResize(camera, renderer);

const overviewScene = new THREE.Scene();
overviewScene.add(createStarfield());
const solarSystem = buildSolarSystem(overviewScene);

const input = new InputManager();
const audio = new SolarAudio();

const totalNodes = PLANETS.reduce((sum, p) => sum + p.nodes.length, 0);
const hud = new HUD({
  totalNodes,
  onToggleMute: (muted) => audio.setMuted(muted),
  onQualityChange: (q) => applyQuality(q),
});

function applyQuality(q) {
  const pr = { low: 1, medium: 1.4, high: 2, ultra: 2 }[q] ?? 1.4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pr));
  renderer.shadowMap.enabled = q !== 'low';
}

// --- mode state machine: 'overview' (solar system, click a planet) ->
// 'flying' (camera transition) -> 'planet' (walking a tiny-planet surface,
// 'M' returns to 'overview'). One shared camera, two kinds of scenes: the
// single overview scene, and one lazily-built+cached walkable scene per
// planet (so revisiting a planet doesn't rebuild it or lose progress).
let mode = 'overview';
let activePlanet = null;
const planetScenes = new Map();
let flyProgress = 0;
const flyFrom = new THREE.Vector3();

camera.position.set(0, 70, 230);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
renderer.domElement.addEventListener('click', (e) => {
  if (mode !== 'overview' || hud.isPanelOpen) return;
  pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(solarSystem.planetMeshes.map((p) => p.body));
  if (hits.length) {
    const entry = solarSystem.planetMeshes.find((p) => p.body === hits[0].object);
    if (entry) beginTravelTo(entry.data);
  }
});

function getOrBuildPlanetScene(data) {
  if (planetScenes.has(data.id)) return planetScenes.get(data.id);

  const scene = new THREE.Scene();
  scene.add(createStarfield(1500, 800));
  scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x1a1a2a, 0.85));
  const sunLight = new THREE.DirectionalLight(0xfff2d8, 2.3);
  sunLight.position.set(40, 60, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  scene.add(sunLight);

  const radius = 20;
  const planetHandle = buildTinyPlanet(data, radius);
  scene.add(planetHandle.group);
  const nodes = placeContentNodes(planetHandle.group, data.nodes, radius, data.color);
  decoratePlanet(planetHandle, radius, nodes.map((n) => n.dir), data.color, SPAWN_DIR);

  const character = new CharacterController(scene, radius);
  character.spawnAt(SPAWN_DIR);

  const lifeForms = spawnLifeForms(scene, radius, planetHandle.rand, SPAWN_DIR);

  const entry = { scene, character, planetCamera: new PlanetCamera(camera), nodes, radius, lifeForms, visited: false };
  planetScenes.set(data.id, entry);
  return entry;
}

function beginTravelTo(data) {
  activePlanet = data;
  mode = 'flying';
  flyProgress = 0;
  flyFrom.copy(camera.position);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// touch controls just puppet the same InputManager key set the keyboard uses
function bindHoldButton(id, code) {
  const el = document.getElementById(id);
  const press = (e) => {
    e.preventDefault();
    input.keys.add(code);
  };
  const release = () => input.keys.delete(code);
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('pointercancel', release);
}
bindHoldButton('touch-left', 'KeyA');
bindHoldButton('touch-right', 'KeyD');
document.getElementById('touch-jump').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  input.keys.add('Space');
});

document.getElementById('panel-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'panel-overlay') hud.closePanel();
});

const timer = new THREE.Timer();
timer.connect(document);

function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 1 / 30);

  if (mode === 'overview') {
    updateSolarSystem(solarSystem, dt);
    const t = performance.now() * 0.00003;
    camera.position.set(Math.sin(t) * 230, 75, Math.cos(t) * 230);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    renderer.render(overviewScene, camera);
  } else if (mode === 'flying') {
    updateSolarSystem(solarSystem, dt);
    flyProgress = Math.min(1, flyProgress + dt / 1.6);
    const planetEntry = solarSystem.planetMeshes.find((p) => p.data.id === activePlanet.id);
    const targetPos = planetEntry.group.position.clone().add(new THREE.Vector3(0, activePlanet.size * 1.5, activePlanet.size * 3.2));
    camera.position.lerpVectors(flyFrom, targetPos, easeInOut(flyProgress));
    camera.up.set(0, 1, 0);
    camera.lookAt(planetEntry.group.position);
    renderer.render(overviewScene, camera);

    if (flyProgress >= 1) {
      mode = 'planet';
      const entry = getOrBuildPlanetScene(activePlanet);
      hud.setObjective(`Exploring ${activePlanet.name} — approach a glowing monument and press E.`);
      if (!entry.visited) {
        entry.visited = true;
        hud.showPlanetIntro(activePlanet);
      }
    }
  } else if (mode === 'planet') {
    const entry = planetScenes.get(activePlanet.id);

    if (!hud.isPanelOpen) {
      entry.character.update(dt, { forward: input.forward, turn: input.turn, jump: input.consumeJump() });
    }
    entry.lifeForms.update(dt, entry.character.mesh.position);
    entry.planetCamera.update(dt, entry.character);
    renderer.render(entry.scene, camera);

    if (!hud.isPanelOpen) {
      let nearest = null;
      let nearestDist = Infinity;
      for (const n of entry.nodes) {
        const d = entry.character.mesh.position.distanceTo(n.worldPos);
        if (d < 3.5 && d < nearestDist) {
          nearest = n;
          nearestDist = d;
        }
      }
      if (nearest) {
        hud.showPrompt(`Press E — ${nearest.node.title}`);
        if (input.consumeInteract()) {
          hud.showNodePanel(nearest.node, `${activePlanet.id}:${nearest.node.title}`);
          hud.showToast(`✦ Discovered: ${nearest.node.title}`);
          audio.playDiscoveryChime();
        }
      } else {
        hud.hidePrompt();
        input.consumeInteract();
      }

      if (input.consumeMapToggle()) {
        mode = 'overview';
        hud.setObjective('Click a planet to travel there.');
        hud.hidePrompt();
      }
    }
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
