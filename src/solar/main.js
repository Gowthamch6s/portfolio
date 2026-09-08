import * as THREE from 'three';
import './style.css';
import { createRenderer, createCamera, setupResize, createStarfield } from './core/SceneSetup.js';
import { buildTerrain } from './world/Terrain.js';
import { DISTRICTS, SPAWN_POSITION, buildFlattenZones } from './world/DistrictLayout.js';
import { decorateWorld, placeDistrictNodes } from './world/DistrictDecoration.js';
import { spawnCollectibleOrbs } from './world/CollectibleOrbs.js';
import { WorldCharacterController } from './character/WorldCharacterController.js';
import { WorldCamera } from './character/WorldCamera.js';
import { spawnLifeForms } from './environment/LifeForms.js';
import { buildHeroPlanet } from './intro/HeroPlanet.js';
import { HUD } from './ui/HUD.js';
import { SolarAudio } from './audio/SolarAudio.js';
import { InputManager } from '../input/InputManager.js';

const canvas = document.createElement('canvas');
canvas.id = 'scene';
document.getElementById('app').appendChild(canvas);

const renderer = createRenderer(canvas);
const camera = createCamera();
setupResize(camera, renderer);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040c);
scene.fog = new THREE.FogExp2(0x1a2438, 0.0035);
scene.add(createStarfield(2200, 1400));

scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x2a3a2a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d8, 2.4);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -160;
sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160;
sun.shadow.camera.bottom = -160;
sun.shadow.camera.far = 400;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// --- the one well-established "home" planet, seen only during the space
// intro — the world you actually walk on is the flat terrain below. ---
const PLANET_POSITION = new THREE.Vector3(0, -20, -260);
const heroPlanet = buildHeroPlanet(120);
heroPlanet.group.position.copy(PLANET_POSITION);
scene.add(heroPlanet.group);

// --- the walkable world: ONE continuous terrain, districts as zones on it,
// matching the reference game's single connected map exactly. Hidden until
// the landing cinematic reveals it. ---
const worldRoot = new THREE.Group();
worldRoot.visible = false;
scene.add(worldRoot);

const flattenZones = buildFlattenZones();
worldRoot.add(buildTerrain(420, 180, flattenZones));
decorateWorld(worldRoot, SPAWN_POSITION, DISTRICTS);

const allNodes = [];
for (const district of DISTRICTS) {
  const nodes = placeDistrictNodes(worldRoot, district);
  for (const n of nodes) allNodes.push({ ...n, district });
}

const orbs = spawnCollectibleOrbs(worldRoot, DISTRICTS);

const character = new WorldCharacterController(worldRoot, flattenZones);
character.spawnAt(SPAWN_POSITION.x, SPAWN_POSITION.z);
const worldCamera = new WorldCamera(camera);

const lifeForms = spawnLifeForms(worldRoot, DISTRICTS, SPAWN_POSITION);

const input = new InputManager();
const audio = new SolarAudio();

const hud = new HUD({
  totalNodes: allNodes.length,
  districts: DISTRICTS,
  onToggleMute: (muted) => audio.setMuted(muted),
  onQualityChange: (q) => applyQuality(q),
});

function applyQuality(q) {
  const pr = { low: 1, medium: 1.4, high: 2, ultra: 2 }[q] ?? 1.4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pr));
  renderer.shadowMap.enabled = q !== 'low';
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
bindHoldButton('touch-boost', 'ShiftLeft');
document.getElementById('touch-jump').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  input.keys.add('Space');
});
// touch throttle is implicit — holding either turn button also walks forward,
// matching a simple "always advancing" feel on mobile
bindHoldButton('touch-left', 'KeyW');
bindHoldButton('touch-right', 'KeyW');

document.getElementById('panel-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'panel-overlay') hud.closePanel();
});

// ---------------------------------------------------------------------
// Landing cinematic: fly the camera in toward Terra, fade to black, swap
// in the walkable world, fade back up, then strip the player's spacesuit
// now that they're standing on a breathable planet.
// ---------------------------------------------------------------------
const introCaption = document.getElementById('intro-caption');
const introFade = document.getElementById('intro-fade');
const hudRoot = document.getElementById('progress-panel');
const topBar = document.getElementById('top-bar');
const bottomHud = document.getElementById('bottom-hud');
const exitLink = document.getElementById('exit-game');
const touchControls = document.getElementById('touch-controls');

const FLIGHT_DURATION = 5.5;
const FADE_DURATION = 0.7;
const camSpaceStart = new THREE.Vector3(0, 90, 140);
const camSpaceEnd = new THREE.Vector3(0, 24, -50);
const lookTarget = PLANET_POSITION.clone();

let introPhase = 'flight'; // 'flight' | 'fadeOut' | 'reveal' | 'fadeIn' | 'done'
let phaseTime = 0;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function runIntro(dt) {
  phaseTime += dt;

  if (introPhase === 'flight') {
    const t = Math.min(phaseTime / FLIGHT_DURATION, 1);
    const eased = easeInOutCubic(t);
    camera.position.lerpVectors(camSpaceStart, camSpaceEnd, eased);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookTarget);
    heroPlanet.group.rotation.y += dt * 0.05;
    heroPlanet.clouds.rotation.y += dt * 0.08;
    if (t >= 1) {
      introPhase = 'fadeOut';
      phaseTime = 0;
      introFade.classList.add('visible');
    }
    return;
  }

  if (introPhase === 'fadeOut') {
    if (phaseTime >= FADE_DURATION) {
      // swap scenes while the screen is fully black
      worldRoot.visible = true;
      introCaption.classList.remove('visible');
      character.landOnPlanet();
      hud.setObjective('Explore — approach a glowing district to begin a mission.');
      introPhase = 'fadeIn';
      phaseTime = 0;
      introFade.classList.remove('visible');
    }
    return;
  }

  if (introPhase === 'fadeIn') {
    if (phaseTime >= FADE_DURATION) {
      introPhase = 'done';
      hudRoot.classList.add('visible-ui');
      topBar.classList.add('visible-ui');
      bottomHud.classList.add('visible-ui');
      exitLink.classList.add('visible-ui');
      touchControls.classList.add('visible-ui');
    }
  }
}

// One-time "you're near a new district" reveal, tracked per district id.
const enteredDistricts = new Set();

const timer = new THREE.Timer();
timer.connect(document);

function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 1 / 30);

  if (introPhase !== 'done') {
    runIntro(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
    return;
  }

  if (!hud.isPanelOpen) {
    character.update(dt, { forward: input.forward, turn: input.turn, jump: input.consumeJump(), boost: input.boost });
  }
  lifeForms.update(dt, character.position);
  worldCamera.update(dt, character);
  hud.updateMap(SPAWN_POSITION, character.position, character.heading);

  const collectedDistrict = orbs.update(dt, character.position);
  if (collectedDistrict) {
    const p = orbs.progress[collectedDistrict.id];
    hud.showToast(`✦ Build Orb collected — ${p.collected}/${p.total}`);
    audio.playDiscoveryChime();
  }

  if (!hud.isPanelOpen) {
    // track which district (if any) the player is currently inside
    let activeDistrict = null;
    for (const district of DISTRICTS) {
      const d = Math.hypot(character.position.x - district.position.x, character.position.z - district.position.z);
      if (d < district.clearRadius) {
        activeDistrict = district;
        break;
      }
    }
    if (activeDistrict) {
      if (!enteredDistricts.has(activeDistrict.id)) {
        enteredDistricts.add(activeDistrict.id);
        hud.showDistrictIntro(activeDistrict);
      }
      const p = orbs.progress[activeDistrict.id];
      hud.setObjective(`Exploring ${activeDistrict.name} — Build Orbs ${p.collected}/${p.total} · approach a glowing monument and press E.`);
      hud.showDistrictBanner(activeDistrict, p.collected, p.total);
    } else {
      hud.setObjective('Explore — approach a glowing district to begin a mission.');
      hud.hideDistrictBanner();
    }

    let nearest = null;
    let nearestDist = Infinity;
    for (const n of allNodes) {
      const d = character.mesh.position.distanceTo(n.worldPos);
      if (d < 3.5 && d < nearestDist) {
        nearest = n;
        nearestDist = d;
      }
    }
    if (nearest) {
      hud.showPrompt(`Press E — ${nearest.node.title}`);
      if (input.consumeInteract()) {
        hud.showNodePanel(nearest.node, `${nearest.district.id}:${nearest.node.title}`);
        hud.showToast(`✦ Discovered: ${nearest.node.title}`);
        audio.playDiscoveryChime();
      }
    } else {
      hud.hidePrompt();
      input.consumeInteract();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

camera.position.copy(camSpaceStart);
camera.lookAt(lookTarget);
requestAnimationFrame(tick);
