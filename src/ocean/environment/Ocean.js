import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

// A procedurally-generated tileable normal map, drawn on a canvas at
// startup instead of fetched from a network asset — keeps the game fully
// self-contained. Layered sine ripples baked into RGB normal channels give
// Water.js's shader something non-flat to reflect/refract against.
function buildWaterNormalTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);

  const layers = [
    { freqX: 6, freqY: 5, amp: 0.5 },
    { freqX: 13, freqY: 9, amp: 0.3 },
    { freqX: 23, freqY: 19, amp: 0.2 },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      let nx = 0;
      let ny = 0;
      for (const l of layers) {
        nx += Math.sin(u * l.freqX + v * 0.6) * l.amp;
        ny += Math.sin(v * l.freqY + u * 0.6) * l.amp;
      }
      const idx = (y * size + x) * 4;
      img.data[idx] = ((nx * 0.5 + 0.5) * 255) | 0;
      img.data[idx + 1] = ((ny * 0.5 + 0.5) * 255) | 0;
      img.data[idx + 2] = 255; // pointing mostly up (+Z in tangent space)
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createOcean(size = 6000) {
  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  const normalMap = buildWaterNormalTexture();

  const water = new Water(geometry, {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: normalMap,
    sunDirection: new THREE.Vector3(0, 1, 0),
    sunColor: 0xffffff,
    waterColor: 0x0e6b7a,
    distortionScale: 2.6,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms.size.value = 3.2;

  return water;
}

// Called every frame: advances the wave animation and re-tints the water
// color between the reference image's turquoise-tropical (day) and deep
// navy (night) palettes.
const DAY_WATER = new THREE.Color(0x1fb7c4);
const NIGHT_WATER = new THREE.Color(0x061a2e);

export function updateOcean(water, dt, dayNightFactor, sunDir) {
  water.material.uniforms.time.value += dt * 0.6;
  water.material.uniforms.sunDirection.value.copy(sunDir).normalize();
  const tinted = DAY_WATER.clone().lerp(NIGHT_WATER, dayNightFactor);
  water.material.uniforms.waterColor.value.copy(tinted);
}
