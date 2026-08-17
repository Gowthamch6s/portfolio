import * as THREE from 'three';

function buildSpiralTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  const arms = 5;
  for (let a = 0; a < arms; a++) {
    ctx.beginPath();
    const armOffset = (a / arms) * Math.PI * 2;
    for (let t = 0; t < 1; t += 0.005) {
      const angle = armOffset + t * Math.PI * 6;
      const r = t * size * 0.48;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.5 - a * 0.02})`;
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  grad.addColorStop(0, 'rgba(5,20,30,0.9)');
  grad.addColorStop(0.6, 'rgba(10,40,55,0.4)');
  grad.addColorStop(1, 'rgba(10,40,55,0)');
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// A swirling vortex obstacle: a rotating spiral-textured disc plus sinking
// funnel rings, sitting flush with the water. `radius`/`strength` are read
// by BoatController.applyWhirlpool for the actual gameplay pull.
export class Whirlpool {
  constructor(scene, position, radius = 22) {
    this.position = position;
    this.radius = radius;
    this.strength = 34;

    const texture = buildSpiralTexture();
    const discGeo = new THREE.CircleGeometry(radius, 48);
    const discMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    this.disc = new THREE.Mesh(discGeo, discMat);
    this.disc.rotation.x = -Math.PI / 2;
    this.disc.position.copy(position);
    this.disc.position.y = 0.05;
    scene.add(this.disc);

    this.rings = [];
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * (1 - t * 0.7), 0.25, 8, 32),
        new THREE.MeshStandardMaterial({ color: 0x0e2b38, roughness: 0.6, transparent: true, opacity: 0.6 - t * 0.1 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(position);
      ring.position.y = -t * 1.8;
      scene.add(ring);
      this.rings.push({ mesh: ring, depth: t });
    }

    this.clock = 0;
  }

  update(dt) {
    this.clock += dt;
    this.disc.rotation.z += dt * 0.8;
    for (const { mesh, depth } of this.rings) {
      mesh.rotation.z -= dt * (1.2 + depth * 0.8);
      mesh.position.y = -depth * 1.8 + Math.sin(this.clock * 2 + depth * 5) * 0.05;
    }
  }
}
