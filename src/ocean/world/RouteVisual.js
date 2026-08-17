import * as THREE from 'three';

function buildLabelSprite(text, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const accentHex = `#${new THREE.Color(accent).getHexString()}`;

  const radius = 28;
  ctx.fillStyle = 'rgba(6, 20, 28, 0.72)';
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(6, 30, canvas.width - 12, 68, radius);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 34px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#eaf6ff';
  ctx.fillText(text, canvas.width / 2, 64, canvas.width - 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(9, 2.25, 1);
  return sprite;
}

// The glowing route line itself (a tube along the curve) plus one floating
// billboard label per island, matching the reference image's overlaid
// "project name tags" strung along the path between islands.
export function buildRouteVisual(curve, islands) {
  const group = new THREE.Group();

  const tubeGeo = new THREE.TubeGeometry(curve, 220, 0.55, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x1fd7e8,
    emissive: 0x1fd7e8,
    emissiveIntensity: 1.4,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.position.y = 0.15;
  group.add(tube);

  const dashGeo = new THREE.TubeGeometry(curve, 220, 0.85, 6, false);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x1fd7e8, transparent: true, opacity: 0.12, side: THREE.BackSide });
  const glow = new THREE.Mesh(dashGeo, dashMat);
  glow.position.y = 0.15;
  group.add(glow);

  const labels = [];
  for (const island of islands) {
    const sprite = buildLabelSprite(island.title, island.accent);
    sprite.position.copy(island.position).add(new THREE.Vector3(0, island.radius * 0.55 + 6, 0));
    group.add(sprite);
    labels.push(sprite);
  }

  return { group, tubeMaterial: tubeMat, labels };
}

export function updateRouteVisual(tubeMaterial, dt, dayNightFactor) {
  tubeMaterial.emissiveIntensity = 1.1 + Math.sin(performance.now() * 0.002) * 0.25 + dayNightFactor * 0.3;
}
