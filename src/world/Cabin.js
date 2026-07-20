import * as THREE from 'three';

const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.85 }); // falu red
const trimMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e2622, roughness: 0.85 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0x27364a, roughness: 0.6 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0xffdf9e, emissive: 0xffb347, emissiveIntensity: 1.1 });
const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.6 });
const postMat = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.8 });

// A rustic wooden signboard on two posts in front of the cabin — canvas-texture title,
// subtitle, tech line, and bullets, colored per the resume-content's accent (gold for
// education, green for experience, cyan/mint for projects). Exported (not attached inside
// buildCabin) so the caller can ground it at its own real terrain height — see the comment
// on SIGN_DISTANCE in Village.js for why that matters on sloped ground.
export function buildSignboard({ title, subtitle, tech, bullets, accent }) {
  const group = new THREE.Group();

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), postMat);
    post.position.set(side * 0.9, 0.9, 0);
    post.castShadow = true;
    group.add(post);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const accentHex = `#${new THREE.Color(accent).getHexString()}`;

  ctx.fillStyle = '#2a1f18';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.textAlign = 'center';
  let fontSize = 64;
  do {
    ctx.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    fontSize -= 3;
  } while (ctx.measureText(title).width > canvas.width - 90 && fontSize > 30);
  ctx.fillStyle = '#f4e9d8';
  ctx.fillText(title, canvas.width / 2, 100);

  ctx.font = '600 38px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = accentHex;
  ctx.fillText(subtitle, canvas.width / 2, 165);

  ctx.font = '400 32px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#cbb89f';
  ctx.fillText(tech, canvas.width / 2, 212);

  ctx.textAlign = 'left';
  ctx.font = '400 36px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#f4e9d8';
  bullets.forEach((line, i) => ctx.fillText(`· ${line}`, 55, 300 + i * 58));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.05, 0.06),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 })
  );
  board.position.set(0, 1.55, 0);
  board.castShadow = true;
  group.add(board);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.6 })
  );
  lamp.position.set(0, 2.16, 0.06);
  group.add(lamp);

  return group;
}

// A gable roof built from two flat slanted panels, derived so their outer edges land
// exactly on the wall-top corners and their inner edges meet exactly at the ridge — see the
// accompanying math in the module comment history; this is verified-correct, not eyeballed.
function buildRoof(width, depth, wallHeight) {
  const group = new THREE.Group();
  const pitch = 0.55;
  const halfWidth = width / 2;
  const rise = halfWidth * Math.tan(pitch);
  const panelLength = halfWidth / Math.cos(pitch);
  const panelDepth = depth + 0.7;

  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelLength, 0.1, panelDepth), roofMat);
    panel.position.set((side * halfWidth) / 2, wallHeight + rise / 2, 0);
    panel.rotation.z = -side * pitch;
    panel.castShadow = true;
    group.add(panel);

    // full snow blanket draped over each panel — matches the Nordic village houses
    const snow = new THREE.Mesh(new THREE.BoxGeometry(panelLength * 0.96, 0.09, panelDepth * 0.98), snowCapMat);
    snow.position.set((side * halfWidth) / 2, wallHeight + rise / 2 + 0.09, 0);
    snow.rotation.z = -side * pitch;
    group.add(snow);
  }

  const snowCap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, panelDepth), snowCapMat);
  snowCap.position.set(0, wallHeight + rise + 0.04, 0);
  group.add(snowCap);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), wallMat);
  chimney.position.set(halfWidth * 0.4, wallHeight + rise * 0.6 + 0.45, depth * 0.15);
  chimney.castShadow = true;
  group.add(chimney);

  return group;
}

// A low-poly alpine chalet with warm-lit windows, a door, and a gable roof. The signboard is
// built and placed separately (see buildSignboard + Village.js) rather than attached here —
// it sits far enough in front of the cabin that on sloped/noisy terrain the ground height at
// its own position can differ meaningfully from the cabin's, and a rigid parent-child offset
// was sinking it into the snow.
export function buildCabin({ width = 4, depth = 3.2, height = 2.4 } = {}) {
  const group = new THREE.Group();

  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  walls.position.y = height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // white corner boards — Scandinavian timber trim, matching the spawn village
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.14, height, 0.14), trimMat);
      corner.position.set(sx * (width / 2 - 0.02), height / 2, sz * (depth / 2 - 0.02));
      group.add(corner);
    }
  }

  group.add(buildRoof(width, depth, height));

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.46, 0.05), trimMat);
  doorFrame.position.set(0, 0.73, depth / 2 + 0.005);
  group.add(doorFrame);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.08), doorMat);
  door.position.set(0, 0.65, depth / 2 + 0.03);
  group.add(door);

  for (const side of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.64, 0.05), trimMat);
    frame.position.set((side * width) / 3, height * 0.6, depth / 2 + 0.005);
    group.add(frame);
    const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), windowMat);
    window1.position.set((side * width) / 3, height * 0.6, depth / 2 + 0.03);
    group.add(window1);
  }

  return group;
}
