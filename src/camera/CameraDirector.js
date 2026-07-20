import * as THREE from 'three';
import gsap from 'gsap';
import { PlayerState } from '../player/Player.js';
import { getTerrainGradient } from '../terrain/Terrain.js';
import { clamp, damp } from '../utils/mathUtils.js';

const WALK_OFFSET = { x: 0, y: 1.55, z: 2.4 };
// Higher + steeper than a plain chase cam: on an 18.8° slope falling away from the
// camera, a low angle shows almost no snow around the skier — the carved ski trails
// were permanently hidden behind the camera. From up here the tracks flank the skier.
const SKI_OFFSET = { x: 0, y: 5.4, z: 6.6 };
const ATV_OFFSET = { x: 0, y: 2.1, z: 4.2 };
const WALK_FOV = 55;
const SKI_FOV_BASE = 68;
const ATV_FOV = 62;
const SKI_FOV_SPEED_BOOST = 10; // extra FOV at max ski speed, to sell velocity
const ATV_FOV_SPEED_BOOST = 5;
const SKI_MAX_SPEED_REF = 24; // matches Player's SKI_MAX_SPEED for normalizing speed01
const ATV_MAX_SPEED_REF = 14; // matches Player's ATV_MAX_SPEED
const SHAKE_BASE_AMPLITUDE = 0.045;

const OFFSET_BY_STATE = { SKIING: SKI_OFFSET, DRIVING_ATV: ATV_OFFSET, WALKING: WALK_OFFSET, BUYING_GEAR: WALK_OFFSET };
const FOV_BY_STATE = { SKIING: SKI_FOV_BASE, DRIVING_ATV: ATV_FOV, WALKING: WALK_FOV, BUYING_GEAR: WALK_FOV };

const YAW_SENSITIVITY = 0.006;
const PITCH_SENSITIVITY = 0.005;
const MIN_ELEVATION = 0.08; // radians above the horizon plane — stops the camera diving underground
const MAX_ELEVATION = 1.35; // radians — stops it flipping over the top
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.2;
const ZOOM_WHEEL_SENSITIVITY = 0.0011;
const RECENTER_DELAY = 1.4; // seconds of no drag input before yaw drifts back behind the skier
const COLLISION_MARGIN = 0.7;

// Third-person orbit rig: default position is behind-and-above the skier (driven by the same
// per-state offsets as before), but the player can drag to orbit and scroll to zoom. Horizontal
// orbit auto-recenters behind the skier after a short idle delay; a single raycast against the
// registered collidables (terrain, mountains) keeps the camera from clipping through them.
export class CameraDirector {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.offset = { ...WALK_OFFSET };
    this.currentState = PlayerState.WALKING;
    this.bobTime = 0;
    this.shakeTime = 0;

    this.yaw = 0; // user orbit offset, relative to "behind the skier"
    this.pitch = 0; // user elevation offset, relative to the state's default cinematic angle
    this.zoom = 1;
    this._dragging = false;
    this._lastPointer = { x: 0, y: 0 };
    this._idleSinceDrag = 0;

    this.collidables = [];
    this._raycaster = new THREE.Raycaster();
    this._rayDir = new THREE.Vector3();

    this._lookTarget = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._shakeVector = new THREE.Vector3();

    this._attachControls();
  }

  setCollidables(objects) {
    this.collidables = objects;
  }

  _attachControls() {
    const el = this.domElement;
    if (!el) return;

    el.style.touchAction = 'none'; // let us handle single-finger drag ourselves, no browser scroll/zoom

    el.addEventListener('pointerdown', (e) => {
      this._dragging = true;
      this._lastPointer.x = e.clientX;
      this._lastPointer.y = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!this._dragging) return;
      const dx = e.clientX - this._lastPointer.x;
      const dy = e.clientY - this._lastPointer.y;
      this._lastPointer.x = e.clientX;
      this._lastPointer.y = e.clientY;

      this.yaw -= dx * YAW_SENSITIVITY;
      this.pitch = clamp(this.pitch - dy * PITCH_SENSITIVITY, MIN_ELEVATION - 0.9, MAX_ELEVATION - 0.35);
      this._idleSinceDrag = 0;
    });

    const endDrag = () => {
      this._dragging = false;
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointerleave', endDrag);

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom = clamp(this.zoom + e.deltaY * ZOOM_WHEEL_SENSITIVITY, MIN_ZOOM, MAX_ZOOM);
      },
      { passive: false }
    );
  }

  onStateChange(nextState) {
    if (nextState === this.currentState) return;
    this.currentState = nextState;

    const targetOffset = OFFSET_BY_STATE[nextState] ?? WALK_OFFSET;
    const targetFov = FOV_BY_STATE[nextState] ?? WALK_FOV;
    const duration = nextState === PlayerState.SKIING ? 1.6 : 1.2;

    gsap.to(this.offset, { ...targetOffset, duration, ease: 'power2.out' });
    gsap.to(this.camera, {
      fov: targetFov,
      duration,
      ease: 'power2.out',
      onUpdate: () => this.camera.updateProjectionMatrix(),
    });
  }

  // Clamps the camera distance along `direction` to whatever the nearest registered collidable
  // allows, so orbiting never clips through the terrain or a mountain.
  _resolveCollision(origin, direction, desiredDistance) {
    if (!this.collidables.length) return desiredDistance;
    this._raycaster.set(origin, direction);
    this._raycaster.far = desiredDistance;
    const hits = this._raycaster.intersectObjects(this.collidables, true);
    if (hits.length === 0) return desiredDistance;
    return Math.max(hits[0].distance - COLLISION_MARGIN, 1.0);
  }

  update(dt, player) {
    // Auto-recenter the horizontal orbit behind the skier after the player stops dragging —
    // keeps free-look available without losing the "facing where you're going" default.
    if (!this._dragging) {
      this._idleSinceDrag += dt;
      if (this._idleSinceDrag > RECENTER_DELAY) {
        this.yaw = damp(this.yaw, 0, 2.5, dt);
      }
    }

    this._lookTarget.copy(player.position);
    this._lookTarget.y += 1.3;

    const baseElevation = Math.atan2(this.offset.y, this.offset.z);
    const baseRadius = Math.hypot(this.offset.y, this.offset.z);
    const elevation = clamp(baseElevation + this.pitch, MIN_ELEVATION, MAX_ELEVATION);
    const azimuth = player.heading + Math.PI + this.yaw;

    let radius = baseRadius * this.zoom;

    let bobOffset = 0;
    let shake = null;
    if (this.currentState === PlayerState.WALKING) {
      this.bobTime += dt * (2 + player.walkSpeed01 * 6);
      bobOffset = Math.sin(this.bobTime) * 0.05 * player.walkSpeed01;
    } else if (this.currentState === PlayerState.SKIING) {
      const speed01 = Math.min(1, player.skiSpeed / SKI_MAX_SPEED_REF);
      radius += speed01 * 2.2;

      const targetFov = SKI_FOV_BASE + speed01 * SKI_FOV_SPEED_BOOST;
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 2);
      this.camera.updateProjectionMatrix();

      shake = this._computeShake(dt, player, speed01);
    } else if (this.currentState === PlayerState.DRIVING_ATV) {
      const speed01 = Math.min(1, (player.atvSpeed ?? 0) / ATV_MAX_SPEED_REF);
      const targetFov = ATV_FOV + speed01 * ATV_FOV_SPEED_BOOST;
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 2);
      this.camera.updateProjectionMatrix();
    }

    this._rayDir.set(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation)
    );

    radius = this._resolveCollision(this._lookTarget, this._rayDir, radius);

    this._desired.copy(this._lookTarget).addScaledVector(this._rayDir, radius);
    this._desired.y += bobOffset;
    if (shake) this._desired.add(shake);

    // Smooth interpolation ("camera lag") rather than snapping straight to the target spot.
    this.camera.position.lerp(this._desired, Math.min(1, dt * 6));
    this.camera.lookAt(this._lookTarget);
  }

  // Gentle shake while skiing, stronger over rougher ground and at higher speed — layered
  // sine waves at incommensurate frequencies read as organic jitter rather than a metronome.
  _computeShake(dt, player, speed01) {
    const { dHdx, dHdz } = getTerrainGradient(player.position.x, player.position.z);
    const roughness = clamp(Math.hypot(dHdx, dHdz) * 0.5, 0, 1);
    const amplitude = SHAKE_BASE_AMPLITUDE * speed01 * (0.25 + roughness);

    this.shakeTime += dt * (9 + speed01 * 9);
    return this._shakeVector.set(
      Math.sin(this.shakeTime * 13.1) * amplitude,
      Math.sin(this.shakeTime * 17.7 + 1.3) * amplitude * 0.6,
      Math.sin(this.shakeTime * 11.3 + 2.7) * amplitude
    );
  }
}
