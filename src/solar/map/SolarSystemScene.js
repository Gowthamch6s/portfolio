import * as THREE from 'three';
import { PLANETS } from '../data/planetsData.js';

function buildLabelSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const accent = `#${new THREE.Color(colorHex).getHexString()}`;
  ctx.fillStyle = 'rgba(6, 10, 22, 0.7)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(6, 34, canvas.width - 12, 60, 24);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 32px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#eaf0ff';
  ctx.fillText(text, canvas.width / 2, 64, canvas.width - 40);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(11, 2.75, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// A believable-enough planet: base sphere + a couple of noisy-ish surface
// bands via vertex color, an optional ring, and a soft atmosphere glow shell.
function buildPlanet(data) {
  const group = new THREE.Group();

  const geometry = new THREE.IcosahedronGeometry(data.size, 5);
  const pos = geometry.attributes.position;
  const colorA = new THREE.Color(data.color);
  const colorB = colorA.clone().offsetHSL(0, -0.15, -0.18);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / data.size;
    const n = Math.sin(y * 6 + pos.getX(i) * 0.7) * 0.5 + 0.5;
    const c = colorA.clone().lerp(colorB, n * 0.6 + Math.random() * 0.15);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    // gentle displacement so it doesn't read as a perfect geometric primitive
    const disp = 1 + (Math.sin(y * 10) * 0.015 + Math.random() * 0.01);
    pos.setXYZ(i, pos.getX(i) * disp, pos.getY(i) * disp, pos.getZ(i) * disp);
  }
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // a low-level self-emissive tint (in its own color) so the planet reads
  // as a glowing world even from an angle the light doesn't reach, rather
  // than ever going flat black
  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.05, emissive: data.color, emissiveIntensity: 0.18 })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(data.size * 1.12, 24, 24),
    new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.12, side: THREE.BackSide })
  );
  group.add(glow);

  if (data.isStation) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(data.size * 1.6, data.size * 0.06, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0xcfd6e0, roughness: 0.4, metalness: 0.6, emissive: data.color, emissiveIntensity: 0.3 })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);
  } else if (Math.random() > 0.4) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(data.size * 1.3, data.size * 1.75, 48),
      new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);
  }

  const label = buildLabelSprite(data.name, data.color);
  label.position.y = data.size * 1.9 + 2;
  group.add(label);

  return { group, body };
}

export function buildSolarSystem(scene) {
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(14, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  scene.add(sun);
  // decay=0 (no distance falloff) is physically wrong but deliberate — with
  // decay=2 (the default, real inverse-square falloff), planets at orbit
  // radii up to 150+ receive essentially zero light and render as flat dark
  // circles. This is a stylized map screen, not a physically-based scene, so
  // every planet just gets evenly lit regardless of orbit distance.
  const sunLight = new THREE.PointLight(0xffe8b0, 4.5, 0, 0);
  scene.add(sunLight);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(19, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffcf6b, transparent: true, opacity: 0.25 })
  );
  sun.add(sunGlow);
  scene.add(new THREE.AmbientLight(0x506080, 0.85));

  const homeLabel = buildLabelSprite('Home', 0xffe8b0);
  homeLabel.position.y = 24;
  sun.add(homeLabel);

  const orbits = [];
  const planetMeshes = [];

  for (const data of PLANETS) {
    const { group, body } = buildPlanet(data);
    scene.add(group);
    planetMeshes.push({ data, group, body, angle: Math.random() * Math.PI * 2 });

    const orbitGeo = new THREE.RingGeometry(data.orbitRadius - 0.06, data.orbitRadius + 0.06, 128);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x3a5a7a, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);
    orbits.push(orbitLine);
  }

  return { sun, sunLight, planetMeshes, orbits };
}

export function updateSolarSystem(system, dt) {
  for (const p of system.planetMeshes) {
    p.angle += p.data.orbitSpeed * dt;
    const x = Math.cos(p.angle) * p.data.orbitRadius;
    const z = Math.sin(p.angle) * p.data.orbitRadius;
    const y = Math.sin(p.angle * 1.7) * p.data.orbitRadius * 0.06 * p.data.tilt;
    p.group.position.set(x, y, z);
    p.body.rotation.y += dt * 0.15;
  }
}
