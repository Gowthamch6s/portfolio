import * as THREE from 'three';
import { getFarTerrainHeight } from '../terrain/Terrain.js';

// A soft radial-gradient sprite texture — cheap stand-in for real raymarched volumetric fog.
// Scattering enough overlapping, low-opacity sprites in the mountain valleys reads as haze
// without the cost of an actual volumetric pass.
function buildFogTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Scatters translucent billboarded fog-bank sprites through the ring of distant mountains,
// sitting low in the "valleys" between peaks for a hazy, layered depth cue.
export function createFogBanks({ count = 40, innerRadius = 500, outerRadius = 950 } = {}) {
  const group = new THREE.Group();
  const texture = buildFogTexture();
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xdfeeff,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    fog: false,
  });

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = innerRadius + Math.random() * (outerRadius - innerRadius);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const groundY = getFarTerrainHeight(x, z);

    const sprite = new THREE.Sprite(material);
    const scale = 60 + Math.random() * 90;
    sprite.scale.set(scale, scale * 0.5, 1);
    sprite.position.set(x, groundY + scale * 0.18, z);
    group.add(sprite);
  }

  return group;
}
