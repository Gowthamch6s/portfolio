import * as THREE from 'three';
import { PlayerState } from '../player/Player.js';

const MAX_SAMPLES = 360;
const SAMPLE_MIN_DISTANCE = 0.35; // world units between samples — density independent of speed
const FADE_DURATION = 10; // seconds a track segment stays visible before fully fading
// Two *separate* crisp lines read as ski tracks; at the old 0.55 width with skis only
// 0.32 apart the ribbons overlapped into one smeared blob that vanished into the snow.
const TRACK_WIDTH = 0.38;
const SKI_OFFSET = 0.3; // lateral offset of each track from the player centerline
const TRACK_LIFT = 0.025; // just above the *actual raycasted* surface — see addSample

// Classic (non-GLSL3) syntax, matching HolographicPanel — three.js's WebGL2 compatibility
// prelude covers `attribute`/`varying`/`gl_FragColor` without needing glslVersion: GLSL3.
const vertexShader = `
  attribute float vAlpha;
  varying float alpha;
  void main() {
    alpha = vAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  varying float alpha;
  void main() {
    gl_FragColor = vec4(0.22, 0.27, 0.35, alpha);
  }
`;

// A single ski's track: a ribbon strip rebuilt every frame from a ring buffer of world-space
// samples. Each sample fades out individually over FADE_DURATION, and each cross-section fades
// a little toward its outer edge — no hard-edged decal rectangle.
class TrailRibbon {
  constructor(scene) {
    this.samples = []; // { left: Vector3, right: Vector3, time }
    this._lastSampledPos = null;
    this._lastIndexCount = -1;

    this.positions = new Float32Array(MAX_SAMPLES * 2 * 3);
    this.alphas = new Float32Array(MAX_SAMPLES * 2);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('vAlpha', new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      // The terrain mesh linearly interpolates height between its grid vertices, while the
      // trail is lifted using the exact analytic height formula at each sample — the two can
      // disagree by more than the lift within a grid cell (roughness noise), which was
      // depth-fighting the ribbon out of view. polygonOffset is the standard fix for a
      // decal coplanar with its surface — it nudges the depth comparison, not the geometry —
      // and (unlike disabling depthTest outright) still occludes correctly behind real objects.
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false; // rebuilt/resized every frame; not worth recomputing bounds
    scene.add(this.mesh);
  }

  addSample(centerPos, sideDir, now) {
    if (this._lastSampledPos && this._lastSampledPos.distanceTo(centerPos) < SAMPLE_MIN_DISTANCE) return;
    this._lastSampledPos = centerPos.clone();

    const left = centerPos.clone().addScaledVector(sideDir, -TRACK_WIDTH / 2);
    const right = centerPos.clone().addScaledVector(sideDir, TRACK_WIDTH / 2);
    left.y += TRACK_LIFT;
    right.y += TRACK_LIFT;

    this.samples.push({ left, right, time: now });
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
  }

  update(now) {
    while (this.samples.length && now - this.samples[0].time > FADE_DURATION) this.samples.shift();

    const count = this.samples.length;
    for (let i = 0; i < count; i++) {
      const s = this.samples[i];
      const age = now - s.time;
      const fade = 1 - THREE.MathUtils.clamp(age / FADE_DURATION, 0, 1);

      this.positions[i * 6 + 0] = s.left.x;
      this.positions[i * 6 + 1] = s.left.y;
      this.positions[i * 6 + 2] = s.left.z;
      this.positions[i * 6 + 3] = s.right.x;
      this.positions[i * 6 + 4] = s.right.y;
      this.positions[i * 6 + 5] = s.right.z;

      // Soft edges: full alpha at the fresh/central end, fading with age; the edge-vs-edge
      // pair itself is thin enough that per-vertex fade alone reads as a soft groove.
      this.alphas[i * 2 + 0] = fade * 0.92;
      this.alphas[i * 2 + 1] = fade * 0.92;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.vAlpha.needsUpdate = true;
    // drawRange on an INDEXED geometry counts indices, not vertices — each of the
    // (count - 1) quads contributes 6 indices. The old `count * 2` was vertex-style
    // math applied here, so only the oldest ~third of the ribbon (the tail end of
    // the samples array) ever fell inside the range — the freshest segment right
    // behind the player, which is exactly what you'd look back to see, was silently
    // never drawn. This is why trails were invisible while skiing.
    this.geometry.setDrawRange(0, Math.max(0, count - 1) * 6);

    if (count !== this._lastIndexCount) {
      const indices = [];
      for (let i = 0; i < count - 1; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, c, b, d, c);
      }
      this.geometry.setIndex(indices);
      this._lastIndexCount = count;
    }
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}

// Two ribbons (one per ski) sampled from the player's actual position/heading while skiing —
// persistent, fading, soft-edged tracks that follow the exact path skied.
export class SkiTrail {
  constructor(scene, terrainMesh) {
    this.left = new TrailRibbon(scene);
    this.right = new TrailRibbon(scene);
    this.terrainMesh = terrainMesh;
    this.clock = 0;
    this._sideDir = new THREE.Vector3();
    this._leftSkiPos = new THREE.Vector3();
    this._rightSkiPos = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();
    this._down = new THREE.Vector3(0, -1, 0);
  }

  // player.position.y comes from the *analytic* height formula, but the rendered terrain mesh
  // linearly interpolates between its grid vertices — the two can disagree by more than a
  // tolerable margin within a cell (roughness noise), which was hiding the trail behind the
  // terrain surface. Raycasting straight down onto the actual mesh gets the exact rendered
  // height instead, so the decal sits precisely on the surface players see, not a guess at it.
  _snapToRenderedSurface(pos) {
    this._raycaster.set(new THREE.Vector3(pos.x, pos.y + 8, pos.z), this._down);
    this._raycaster.far = 20;
    const hits = this._raycaster.intersectObject(this.terrainMesh, false);
    if (hits.length) pos.y = hits[0].point.y;
  }

  update(dt, player) {
    this.clock += dt;

    if (player.state === PlayerState.SKIING && player.velocity.length() > 0.3) {
      this._sideDir.set(Math.cos(player.heading), 0, -Math.sin(player.heading));
      this._leftSkiPos.copy(player.position).addScaledVector(this._sideDir, -SKI_OFFSET);
      this._rightSkiPos.copy(player.position).addScaledVector(this._sideDir, SKI_OFFSET);
      this._snapToRenderedSurface(this._leftSkiPos);
      this._snapToRenderedSurface(this._rightSkiPos);

      this.left.addSample(this._leftSkiPos, this._sideDir, this.clock);
      this.right.addSample(this._rightSkiPos, this._sideDir, this.clock);
    }

    this.left.update(this.clock);
    this.right.update(this.clock);
  }
}
