import * as THREE from 'three';

const PARTICLE_COUNT = 550;
const BOUNDS = new THREE.Vector3(70, 45, 70); // half-extents of the box that follows the camera

// Soft round sprite instead of a hard square point, with size varying per-instance via the
// `aSize` attribute (THREE.PointsMaterial only exposes a single global size, not per-vertex).
const vertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  varying float vOpacity;
  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (220.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.15, d) * vOpacity;
    gl_FragColor = vec4(0.96, 0.98, 1.0, alpha);
  }
`;

// A snowflake volume that always surrounds the camera: particles fall and drift with a shared
// wind, and wrap back to the top (at a fresh random x/z) once they fall out the bottom or drift
// out the sides — so it always looks like continuous snow regardless of where the player goes.
export class Snowfall {
  constructor(scene) {
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.sizes = new Float32Array(PARTICLE_COUNT);
    this.opacities = new Float32Array(PARTICLE_COUNT);
    this.fallSpeeds = new Float32Array(PARTICLE_COUNT);
    this.driftPhases = new Float32Array(PARTICLE_COUNT);
    this.driftAmounts = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._randomizeParticle(i, true);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.time = 0;
    scene.add(this.points);
  }

  _randomizeParticle(i, initial = false) {
    this.positions[i * 3 + 0] = (Math.random() - 0.5) * BOUNDS.x * 2;
    this.positions[i * 3 + 1] = initial ? Math.random() * BOUNDS.y * 2 - BOUNDS.y : BOUNDS.y;
    this.positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2;

    this.sizes[i] = 2 + Math.random() * 7; // varied size
    this.opacities[i] = 0.25 + Math.random() * 0.55; // varied opacity
    this.fallSpeeds[i] = 2.2 + Math.random() * 4.5; // varied speed
    this.driftPhases[i] = Math.random() * Math.PI * 2;
    this.driftAmounts[i] = 0.4 + Math.random() * 1.4; // varied per-flake drift direction/strength
  }

  update(dt, followPoint, playerSpeed = 0) {
    this.time += dt;

    // Wind slowly changes direction/strength on its own, plus a push from the player's own
    // speed (skiing fast reads as wind picking up and snow streaking past).
    const windX = Math.sin(this.time * 0.15) * 1.1 + Math.min(playerSpeed, 24) * 0.05;
    const windZ = Math.cos(this.time * 0.11) * 0.8;
    const speedFactor = 1 + Math.min(playerSpeed, 24) * 0.05; // denser-feeling fall during movement

    const pos = this.positions;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3 + 1] -= this.fallSpeeds[i] * speedFactor * dt;
      pos[i * 3 + 0] += (windX + Math.sin(this.time * 0.6 + this.driftPhases[i]) * this.driftAmounts[i]) * dt;
      pos[i * 3 + 2] += (windZ + Math.cos(this.time * 0.5 + this.driftPhases[i]) * this.driftAmounts[i]) * dt;

      const dx = pos[i * 3 + 0] - followPoint.x;
      const dy = pos[i * 3 + 1] - followPoint.y;
      const dz = pos[i * 3 + 2] - followPoint.z;

      if (dy < -BOUNDS.y || Math.abs(dx) > BOUNDS.x || Math.abs(dz) > BOUNDS.z) {
        pos[i * 3 + 0] = followPoint.x + (Math.random() - 0.5) * BOUNDS.x * 2;
        pos[i * 3 + 1] = followPoint.y + BOUNDS.y;
        pos[i * 3 + 2] = followPoint.z + (Math.random() - 0.5) * BOUNDS.z * 2;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
