import * as THREE from 'three';

const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.9 });
const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.7 });
const lampMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 1.6 });

function buildBanner(text, subtext) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#241c14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 12;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.textAlign = 'center';
  ctx.font = '800 108px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffe9c2';
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 30;
  ctx.fillText(text, canvas.width / 2, 170);
  ctx.shadowBlur = 0;

  ctx.font = '500 50px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#cfd8e6';
  ctx.fillText(subtext, canvas.width / 2, 258);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9), material);
}

// A ski-through landmark arch marking the transition from the education/experience village
// into the skills & projects section of the run — two stone pillars, a timber beam, and a
// lit banner, spaced wide enough (gap*2) for the player to pass straight through the middle.
export function buildArch({ text, subtext, gap = 4.2, pillarHeight = 5.2 }) {
  const group = new THREE.Group();

  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, pillarHeight, 8), pillarMat);
    pillar.position.set(side * gap, pillarHeight / 2, 0);
    pillar.castShadow = true;
    group.add(pillar);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lampMat);
    lamp.position.set(side * gap, pillarHeight - 0.3, 0.5);
    group.add(lamp);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(gap * 2 + 0.9, 0.5, 0.5), beamMat);
  beam.position.set(0, pillarHeight, 0);
  beam.castShadow = true;
  group.add(beam);

  const banner = buildBanner(text, subtext);
  banner.position.set(0, pillarHeight - 1.1, 0.3);
  group.add(banner);

  return group;
}
