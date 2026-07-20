import * as THREE from 'three';
import './style.css';
import { createRenderer, createCamera, createLights, createSky, setupResize } from './core/SceneSetup.js';
import { createTerrainMesh, createCaveEntrance, createFarGroundSkirt, getTerrainHeight } from './terrain/Terrain.js';
import { createMountainRange, updateMountainLODs } from './terrain/Mountains.js';
import { createForest } from './environment/Trees.js';
import { createRockField } from './environment/Rocks.js';
import { Clouds } from './environment/Clouds.js';
import { createFogBanks } from './environment/FogBanks.js';
import { Player, PlayerState } from './player/Player.js';
import { SnowSpray } from './particles/SnowSpray.js';
import { Snowfall } from './particles/Snowfall.js';
import { SkiTrail } from './particles/SkiTrail.js';
import { CameraDirector } from './camera/CameraDirector.js';
import { createVillage } from './world/Village.js';
import { Minimap } from './ui/Minimap.js';
import { InputManager } from './input/InputManager.js';
import { HuskyPack } from './npc/HuskyPack.js';
import { NPCSkierField } from './npc/NPCSkier.js';
import { buildATV } from './vehicle/ATV.js';
import { createNordicVillage, buildNordicHouse } from './world/NordicVillage.js';
import { VillagerCrowd } from './npc/Villager.js';
import { createPostProcessing } from './core/PostProcessing.js';
import { AudioEngine } from './audio/AudioEngine.js';

const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.id = 'scene';
app.appendChild(canvas);

const scene = new THREE.Scene();
const camera = createCamera();
const renderer = createRenderer(canvas);
createLights(scene);
createSky(scene);

const postFX = createPostProcessing(renderer, scene, camera);
setupResize(camera, renderer, (w, h) => postFX.setSize(w, h));

const terrainMesh = createTerrainMesh();
const mountainRange = createMountainRange();
scene.add(createFarGroundSkirt({ size: 3400, segments: 100 }));
scene.add(terrainMesh);
scene.add(createCaveEntrance(-30, -70));
scene.add(createCaveEntrance(24, -240));
scene.add(mountainRange);
scene.add(createForest());
scene.add(createRockField());
scene.add(createFogBanks());
const { group: villageGroup, waypoints: villageWaypoints } = createVillage();
scene.add(villageGroup);
const minimap = new Minimap(villageWaypoints);
const clouds = new Clouds(scene);

// The whole spawn area is now a snowbound Nordic hamlet: timber houses, a bakery,
// a café, a chapel, lamp-lit packed-snow streets — with villagers walking them.
const nordicVillage = createNordicVillage();
scene.add(nordicVillage.group);

// The pro shop itself: a proper timber ski shop just west of the trigger, storefront
// facing the player's approach. (The old placeholder was a plain brown box.)
const SHOP_POSITION = new THREE.Vector3(-7, 0, 46);
const shop = buildNordicHouse({ width: 6, depth: 4.4, height: 2.9, wallColor: 0x8a3324, sign: 'SKI & SPORT', signAccent: '#9fd8ff' });
shop.position.set(SHOP_POSITION.x, getTerrainHeight(SHOP_POSITION.x, SHOP_POSITION.z), SHOP_POSITION.z);
shop.rotation.y = Math.PI / 2; // storefront (+Z face) toward +X — the shop trigger
scene.add(shop);

// A parked ATV beside the shop — hop on to swap skis for wheels near the top of the run.
const ATV_PARK = { x: 14, z: 44 };
const atv = buildATV().group;
atv.position.set(ATV_PARK.x, getTerrainHeight(ATV_PARK.x, ATV_PARK.z), ATV_PARK.z);
scene.add(atv);

const player = new Player(scene);
player.spawnAt(0, 60, Math.PI); // face -Z, downhill, toward the shop

const snowSpray = new SnowSpray(scene);
const snowfall = new Snowfall(scene);
const skiTrail = new SkiTrail(scene, terrainMesh);
const audioEngine = new AudioEngine();
const cameraDirector = new CameraDirector(camera, canvas);
cameraDirector.setCollidables([terrainMesh, mountainRange]);
const input = new InputManager();
const huskyPack = new HuskyPack(scene);
const npcSkierField = new NPCSkierField(scene);
const villagerCrowd = new VillagerCrowd(scene);

player.onCarve = (event) => snowSpray.spray(event);

const SHOP_TRIGGER = { x: 0, z: 44 };
const SKI_START = { x: 0, z: 32 };
const TRIGGER_RADIUS = 4.5;

// Horizontal-only distance — the player's actual height comes from the sloped terrain, so
// comparing against a 3D point with y=0 would make the trigger almost unreachable.
function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

const hud = document.getElementById('hud');
const shopOverlay = document.getElementById('shop-overlay');

const GEAR_OPTIONS = [
  { name: 'Touring Set', agility: 1.0, speedCap: 0.85, blurb: 'Balanced control for a cautious first run.' },
  { name: 'Carving Race Skis', agility: 1.35, speedCap: 1.0, blurb: 'Sharper turns, higher top speed.' },
  { name: 'Powder Boards', agility: 0.8, speedCap: 1.15, blurb: 'Blazing straight-line speed, wider turns.' },
];

function renderShopOverlay() {
  shopOverlay.innerHTML = `
    <div class="panel">
      <h2>Ski Rental &amp; Pro Shop</h2>
      <p class="sub">Pick your gear before dropping into the run.</p>
      <div class="gear-grid">
        ${GEAR_OPTIONS.map(
          (gear, i) => `
          <button class="gear-card" data-index="${i}">
            <strong>${gear.name}</strong>
            <span>${gear.blurb}</span>
            <span class="stats">AGI ${gear.agility.toFixed(2)} · SPD ${gear.speedCap.toFixed(2)}</span>
          </button>
        `
        ).join('')}
      </div>
    </div>
  `;

  shopOverlay.querySelectorAll('.gear-card').forEach((button) => {
    button.addEventListener('click', () => {
      const gear = GEAR_OPTIONS[Number(button.dataset.index)];
      player.gear.agility = gear.agility;
      player.gear.speedCap = gear.speedCap;
      exitShop();
    });
  });
}

function enterShop() {
  player.setState(PlayerState.BUYING_GEAR);
  renderShopOverlay();
  shopOverlay.classList.add('visible');
}

function exitShop() {
  shopOverlay.classList.remove('visible');
  player.spawnAt(SKI_START.x, SKI_START.z, Math.PI);
  player.setState(PlayerState.SKIING);
  cameraDirector.onStateChange(PlayerState.SKIING);
}

function enterATV() {
  player.mesh.add(atv); // reparent onto the player at a fixed seat offset (add() detaches it from the scene automatically)
  atv.position.set(0, 0, 0.3);
  atv.rotation.set(0, 0, 0);
  player.setState(PlayerState.DRIVING_ATV);
  cameraDirector.onStateChange(PlayerState.DRIVING_ATV);
}

function exitATV() {
  scene.attach(atv); // reparent back to the scene, preserving its current world transform
  player.setState(PlayerState.WALKING);
  cameraDirector.onStateChange(PlayerState.WALKING);
}

const timer = new THREE.Timer();
timer.connect(document); // clamps dt after tab is backgrounded, instead of one huge catch-up jump

function updateHud() {
  if (player.state === PlayerState.WALKING) {
    const distanceToShop = horizontalDistance(player.position, SHOP_TRIGGER);
    const distanceToATV = horizontalDistance(player.position, ATV_PARK);
    if (distanceToShop < TRIGGER_RADIUS) {
      hud.textContent = 'Press E to browse gear';
      if (input.consumeInteract()) enterShop();
    } else if (distanceToATV < TRIGGER_RADIUS) {
      hud.textContent = 'Press E to hop on the ATV';
      if (input.consumeInteract()) enterATV();
    } else {
      hud.textContent = 'WASD — walk to the Ski Rental & Pro Shop';
    }
  } else if (player.state === PlayerState.SKIING) {
    hud.textContent = `Skiing — ${Math.round(player.skiSpeed * 3.6)} km/h — A/D to carve`;
  } else if (player.state === PlayerState.DRIVING_ATV) {
    hud.textContent = `Driving ATV — ${Math.round((player.atvSpeed ?? 0) * 3.6)} km/h — Press E to park`;
    if (input.consumeInteract()) exitATV();
  } else {
    hud.textContent = '';
  }
}

const SKI_MAX_SPEED_REF = 24; // matches Player's ski speed cap, used to normalize 0..1 for FX

// Depth of field stays focused on the skier regardless of camera zoom/orbit, and the
// motion-blur stand-in (AfterimagePass) only kicks in once you're actually moving fast —
// no blur while walking or standing still browsing gear.
function updatePostFX(player) {
  postFX.bokehPass.uniforms.focus.value = camera.position.distanceTo(player.position);

  // Capped well below AfterimagePass's max-blend saturation point — with hundreds of small
  // bright bloomed snowflakes constantly refreshing on screen, a higher damp here doesn't
  // decay fast enough between frames and the whole frame ratchets toward white over a few
  // seconds instead of settling into a stable trailing-blur look.
  const speed01 = player.state === PlayerState.SKIING ? Math.min(1, player.skiSpeed / SKI_MAX_SPEED_REF) : 0;
  postFX.afterimagePass.damp = speed01 * 0.22;
}

function tick() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 1 / 30);

  updateHud();
  player.update(dt, { forward: input.forward, turn: input.turn });
  snowSpray.update(dt);
  snowfall.update(dt, camera.position, player.state === PlayerState.SKIING ? player.skiSpeed : 0);
  skiTrail.update(dt, player);
  cameraDirector.update(dt, player);
  huskyPack.update(dt);
  npcSkierField.update(dt);
  villagerCrowd.update(dt);
  clouds.update(dt);
  updateMountainLODs(mountainRange, camera);
  minimap.update(player);
  updatePostFX(player);
  audioEngine.update(dt, {
    isSkiing: player.state === PlayerState.SKIING,
    speed01: player.state === PlayerState.SKIING ? Math.min(1, player.skiSpeed / SKI_MAX_SPEED_REF) : 0,
  });

  postFX.composer.render();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
