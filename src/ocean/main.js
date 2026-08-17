import * as THREE from 'three';
import './style.css';
import { createRenderer, createCamera, setupResize } from './core/SceneSetup.js';
import { DayNightSky } from './environment/DayNightSky.js';
import { createOcean, updateOcean } from './environment/Ocean.js';
import { buildIsland } from './environment/Islands.js';
import { DolphinPod } from './environment/Dolphins.js';
import { Whirlpool } from './environment/Whirlpool.js';
import { BoatController } from './boat/BoatController.js';
import { BoatWake } from './boat/BoatWake.js';
import { BoatCamera } from './camera/BoatCamera.js';
import { ISLANDS, TREASURE_MARKERS, WHIRLPOOL_POSITION, WHIRLPOOL_RADIUS, BOAT_SPAWN, buildRouteCurve } from './world/RouteLayout.js';
import { buildRouteVisual, updateRouteVisual } from './world/RouteVisual.js';
import { buildTreasureMarkers } from './world/TreasureMarkers.js';
import { ConsoleUI } from './ui/ConsoleUI.js';
import { InputManager } from '../input/InputManager.js';

const canvas = document.createElement('canvas');
canvas.id = 'scene';
document.getElementById('app').appendChild(canvas);

const scene = new THREE.Scene();
const camera = createCamera();
const renderer = createRenderer(canvas);
setupResize(camera, renderer);

const daynight = new DayNightSky(scene);

const ocean = createOcean();
scene.add(ocean);

for (const island of ISLANDS) {
  const mesh = buildIsland({ radius: island.radius, seed: ISLANDS.indexOf(island) + 3, treeCount: 6 });
  mesh.position.copy(island.position);
  scene.add(mesh);
}

const routeCurve = buildRouteCurve();
const { group: routeGroup, tubeMaterial } = buildRouteVisual(routeCurve, ISLANDS);
scene.add(routeGroup);

const whirlpool = new Whirlpool(scene, WHIRLPOOL_POSITION, WHIRLPOOL_RADIUS);
const treasures = buildTreasureMarkers(scene, TREASURE_MARKERS);
const dolphinPod = new DolphinPod(scene, 6);

const boat = new BoatController(scene);
boat.position.copy(BOAT_SPAWN);
const wake = new BoatWake(scene);
const boatCamera = new BoatCamera(camera);
const input = new InputManager();

let dayNightManualOverride = false;
const ui = new ConsoleUI({
  islands: ISLANDS,
  treasures: TREASURE_MARKERS,
  whirlpoolPosition: WHIRLPOOL_POSITION,
  whirlpoolRadius: WHIRLPOOL_RADIUS,
  onToggleDayNight: () => {
    dayNightManualOverride = true;
    const t = daynight.toggle();
    ui.setDayNight(t > 0.5);
  },
});

document.getElementById('panel-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'panel-overlay') ui.closePanel();
});

// Touch controls just puppet the same InputManager key set the keyboard
// path uses, so BoatController never needs to know input came from a button.
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
bindHoldButton('touch-throttle', 'KeyW');
bindHoldButton('touch-left', 'KeyA');
bindHoldButton('touch-right', 'KeyD');

const TRIGGER_RADIUS_PAD = 6;
let nearestTarget = null; // { kind: 'island'|'treasure', data }

function findNearestInteractable() {
  let best = null;
  let bestDist = Infinity;
  for (const island of ISLANDS) {
    const d = Math.hypot(boat.position.x - island.position.x, boat.position.z - island.position.z);
    if (d < island.radius + TRIGGER_RADIUS_PAD && d < bestDist) {
      best = { kind: 'island', data: island };
      bestDist = d;
    }
  }
  for (const treasure of treasures) {
    const d = Math.hypot(boat.position.x - treasure.position.x, boat.position.z - treasure.position.z);
    if (d < treasure.radius + TRIGGER_RADIUS_PAD && d < bestDist) {
      best = { kind: 'treasure', data: treasure };
      bestDist = d;
    }
  }
  return best;
}

const timer = new THREE.Timer(); // THREE.Clock is deprecated in this three version
timer.connect(document);

function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 1 / 30);

  if (!ui.isPanelOpen) {
    boat.applyWhirlpool(WHIRLPOOL_POSITION, WHIRLPOOL_RADIUS, whirlpool.strength);
    boat.update(dt, { forward: input.forward, turn: input.turn });
  }

  const speed01 = Math.min(1, Math.abs(boat.speed) / 26);
  if (speed01 > 0.05 && !ui.isPanelOpen) {
    wake.spawn(boat.getWakeWorldPosition(), boat.heading, speed01);
  }
  wake.update(dt);

  daynight.update(dt);
  updateOcean(ocean, dt, daynight.factor, daynight.sunDir);
  updateRouteVisual(tubeMaterial, dt, daynight.factor);
  whirlpool.update(dt);
  dolphinPod.update(dt, boat.position, boat.heading, daynight.factor);
  for (const t of treasures) t.update(dt);

  boatCamera.update(dt, boat);

  ui.updateMap(boat.position, boat.heading);
  ui.updateCompass(boat.heading);
  ui.updateReadouts(boat.speed, THREE.MathUtils.radToDeg(boat.heading));

  if (!ui.isPanelOpen) {
    nearestTarget = findNearestInteractable();
    if (nearestTarget) {
      const label = nearestTarget.kind === 'island' ? nearestTarget.data.title : nearestTarget.data.data.title.replace('!', '');
      ui.showPrompt(`Press E — ${nearestTarget.kind === 'island' ? 'View ' + label : 'Open ' + label}`);
      if (input.consumeInteract()) {
        if (nearestTarget.kind === 'island') {
          ui.showProjectPanel(nearestTarget.data);
        } else {
          nearestTarget.data.open();
          ui.showTreasurePanel(nearestTarget.data.data);
          ui.showToast(`🏆 ${nearestTarget.data.data.title}`);
        }
      }
    } else {
      ui.hidePrompt();
      input.consumeInteract();
    }
  }

  if (boat.inWhirlpool) {
    ui.showToast('🌀 Caught in the whirlpool — throttle away!');
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
