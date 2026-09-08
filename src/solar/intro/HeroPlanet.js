import * as THREE from 'three';

// Cheap seamless-in-x value noise (same technique as the terrain heightmap)
// sampled per-pixel to carve natural, irregular continent coastlines instead
// of overlapping translucent blobs.
function makeNoise2D(seed) {
  function hash2(x, z) {
    const s = Math.sin(x * 127.1 + z * 311.7 + seed) * 43758.5453;
    return s - Math.floor(s);
  }
  return (x, z) => {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const fx = x - x0;
    const fz = z - z0;
    const a = hash2(x0, z0);
    const b = hash2(x0 + 1, z0);
    const c = hash2(x0, z0 + 1);
    const d = hash2(x0 + 1, z0 + 1);
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  };
}

// Canvas-painted Earth-like surface: fractal-noise continents over a deep
// ocean, mountain ranges, and polar ice caps — no external texture assets.
function buildSurfaceTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);

  const n1 = makeNoise2D(11);
  const n2 = makeNoise2D(53);
  const n3 = makeNoise2D(97);

  const deepOcean = [7, 42, 84];
  const shallowOcean = [22, 92, 138];
  const beach = [214, 200, 150];
  const plain = [76, 138, 62];
  const forest = [46, 98, 46];
  const mountain = [120, 108, 92];
  const snowCap = [244, 248, 252];

  const lerp = (a, b, t) => a + (b - a) * t;
  const mixColor = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

  for (let y = 0; y < h; y++) {
    const v = y / h; // 0 at north pole, 1 at south pole
    for (let x = 0; x < w; x++) {
      const u = x / w;
      // wrap x seamlessly so the texture tiles around the sphere
      const nx = Math.cos(u * Math.PI * 2) * 2.6 + 4;
      const nz = Math.sin(u * Math.PI * 2) * 2.6 + 4;
      const ny = v * 5.2;

      let elevation =
        n1(nx * 1.0, ny * 1.0) * 0.55 +
        n2(nx * 2.3, ny * 2.3) * 0.3 +
        n3(nx * 5.1, ny * 5.1) * 0.15;

      // push land toward mid-latitudes, oceans toward poles-adjacent bands,
      // so ice caps read clearly at the very top/bottom
      const latBias = 1 - Math.pow(Math.abs(v - 0.5) * 2, 2) * 0.25;
      elevation *= latBias;

      let color;
      if (elevation < 0.42) {
        color = mixColor(deepOcean, shallowOcean, elevation / 0.42);
      } else if (elevation < 0.46) {
        color = mixColor(shallowOcean, beach, (elevation - 0.42) / 0.04);
      } else if (elevation < 0.58) {
        color = mixColor(beach, plain, (elevation - 0.46) / 0.12);
      } else if (elevation < 0.72) {
        color = mixColor(plain, forest, (elevation - 0.58) / 0.14);
      } else if (elevation < 0.85) {
        color = mixColor(forest, mountain, (elevation - 0.72) / 0.13);
      } else {
        color = mixColor(mountain, snowCap, (elevation - 0.85) / 0.15);
      }

      // polar ice caps regardless of elevation
      const poleDist = Math.min(v, 1 - v);
      if (poleDist < 0.1) {
        color = mixColor(snowCap, color, poleDist / 0.1);
      }

      const i = (y * w + x) * 4;
      img.data[i] = color[0];
      img.data[i + 1] = color[1];
      img.data[i + 2] = color[2];
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// Soft alpha-mapped cloud bands on a transparent canvas, applied to a
// slightly larger sphere so they read as an independent, drifting layer.
function buildCloudTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 220; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.85 + h * 0.05;
    const r = 8 + rand() * 34;
    ctx.fillStyle = `rgba(255,255,255,${0.12 + rand() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.5, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const atmosphereShader = {
  uniforms: { glowColor: { value: new THREE.Color(0x6fd0ff) } },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform vec3 glowColor;
    void main() {
      float rim = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(glowColor, clamp(rim, 0.0, 1.0));
    }
  `,
};

// The single well-established "home" planet the hero descends to — a
// detailed Earth-like sphere with continents, drifting clouds, and a rim-lit
// atmosphere. Purely a set-dressing object for the space intro; the actual
// walkable surface is the flat terrain built separately.
export function buildHeroPlanet(radius = 120) {
  const group = new THREE.Group();

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    new THREE.MeshStandardMaterial({ map: buildSurfaceTexture(), roughness: 0.85, metalness: 0.05 })
  );
  group.add(surface);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.015, 48, 48),
    new THREE.MeshStandardMaterial({ map: buildCloudTexture(), transparent: true, depthWrite: false, roughness: 1 })
  );
  group.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 48, 48),
    new THREE.ShaderMaterial({
      ...atmosphereShader,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(atmosphere);

  return { group, surface, clouds };
}
