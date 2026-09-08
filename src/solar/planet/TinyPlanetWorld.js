import * as THREE from 'three';

// ---------- shared materials ----------
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9, flatShading: true });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.85 });

// ---------- deterministic PRNG (same planet always looks the same) ----------
function makeRng(seedStr) {
  let seed = seedStr.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// A tileable asphalt-with-lane-markings texture, drawn on a canvas instead
// of fetched — dark road body, a dashed yellow centerline, and solid white
// edge lines, matching the reference game's road styling.
function buildRoadTexture() {
  const w = 128;
  const h = 256; // tall so the dashes read correctly once repeated along the road's length
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2b2e33';
  ctx.fillRect(0, 0, w, h);
  // edge lines
  ctx.fillStyle = '#e8e8e0';
  ctx.fillRect(w * 0.08, 0, w * 0.05, h);
  ctx.fillRect(w * 0.87, 0, w * 0.05, h);
  // dashed centerline
  ctx.fillStyle = '#e8c23c';
  const dashLen = h * 0.16;
  for (let y = 0; y < h; y += dashLen * 2) {
    ctx.fillRect(w * 0.475, y, w * 0.05, dashLen);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// A blocky low-poly tree — cone canopy(es) + cylinder trunk, matching the
// reference's simple faceted-forest look.
function buildTree(rand) {
  const group = new THREE.Group();
  const trunkH = 0.5 + rand() * 0.3;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const leafColor = new THREE.Color().setHSL(0.32 + rand() * 0.05, 0.55, 0.32 + rand() * 0.12);
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8, flatShading: true });
  const tiers = 2 + Math.floor(rand() * 2);
  for (let t = 0; t < tiers; t++) {
    const size = (0.55 - t * 0.13) * (0.85 + rand() * 0.3);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(size, size * 1.3, 7), leafMat);
    cone.position.y = trunkH + t * 0.42 + size * 0.5;
    group.add(cone);
  }
  return group;
}

// A single blocky low-poly building — box tower with a few emissive
// "lit window" strips, standing in for the reference's background skyline.
function buildBuilding(rand, accentColor) {
  const w = 1.4 + rand() * 1.2;
  const d = 1.4 + rand() * 1.2;
  const h = 3 + rand() * 7;
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.6, 0.08, 0.25 + rand() * 0.15), roughness: 0.7 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);

  const windowMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 1.3 });
  const rows = Math.max(1, Math.floor(h / 1.1));
  for (let r = 0; r < rows; r++) {
    if (rand() < 0.4) continue; // some floors dark
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.18, 0.02), windowMat);
    strip.position.set(0, 0.6 + r * 1.1, d / 2 + 0.01);
    group.add(strip);
  }
  return group;
}

// Builds a closed loop path of world-space points around the sphere,
// visiting each content-node position along the way (so the road reads as
// "the path that connects the stops"), interpolated with slerp so every
// intermediate point stays exactly on the sphere.
function buildRoadPath(radius, waypointDirs, segmentsPerLeg = 28) {
  const points = [];
  const n = waypointDirs.length;
  for (let i = 0; i < n; i++) {
    const a = waypointDirs[i];
    const b = waypointDirs[(i + 1) % n];
    const angle = a.angleTo(b);
    for (let s = 0; s < segmentsPerLeg; s++) {
      const t = s / segmentsPerLeg;
      let dir;
      if (angle < 1e-4) {
        dir = a.clone();
      } else {
        // manual slerp between two unit vectors
        const sinAngle = Math.sin(angle);
        dir = a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
          .add(b.clone().multiplyScalar(Math.sin(t * angle) / sinAngle));
      }
      points.push(dir.normalize().multiplyScalar(radius));
    }
  }
  return points;
}

function buildRoadMesh(pathPoints, radius, width = 1.4) {
  const positions = [];
  const uvs = [];
  const indices = [];
  let cumLength = 0;

  for (let i = 0; i < pathPoints.length; i++) {
    const p = pathPoints[i];
    const next = pathPoints[(i + 1) % pathPoints.length];
    const up = p.clone().normalize();
    const forward = next.clone().sub(p).normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const left = p.clone().addScaledVector(right, -width / 2).addScaledVector(up, 0.05);
    const rightP = p.clone().addScaledVector(right, width / 2).addScaledVector(up, 0.05);
    positions.push(left.x, left.y, left.z, rightP.x, rightP.y, rightP.z);

    const v = cumLength / (radius * 0.6); // texture repeat scale
    uvs.push(0, v, 1, v);
    cumLength += p.distanceTo(next);

    if (i < pathPoints.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const texture = buildRoadTexture();
  texture.repeat.set(1, Math.max(1, Math.round(cumLength / (radius * 0.6))));
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// Minimum chord-distance from `pos` to the road path, sampled sparsely for
// speed (this only runs during one-time scatter setup, not per frame).
function distanceToRoad(pos, roadPoints, step = 3) {
  let min = Infinity;
  for (let i = 0; i < roadPoints.length; i += step) {
    const d = pos.distanceTo(roadPoints[i]);
    if (d < min) min = d;
  }
  return min;
}

// One low-poly walkable planet surface: rolling grass-covered ground, a
// paved road (with lane markings) looping past every content node, dense
// low-poly grass/trees/rocks scattered off the road, and a small distant
// skyline of blocky lit buildings — matching the reference game's
// city-meets-nature aesthetic instead of a bare/generic sphere.
export function buildTinyPlanet(data, radius = 20) {
  const group = new THREE.Group();
  const rand = makeRng(data.id);

  const groundColor = new THREE.Color().setHSL(0.32, 0.45, 0.28);
  const groundGeo = new THREE.IcosahedronGeometry(radius, 5);
  const gPos = groundGeo.attributes.position;
  const colors = new Float32Array(gPos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < gPos.count; i++) {
    const shade = 0.85 + rand() * 0.3;
    c.copy(groundColor).multiplyScalar(shade);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }));
  ground.receiveShadow = true;
  ground.castShadow = true;
  group.add(ground);

  return { group, ground, rand, groundColor };
}

// Called once the content-node world directions are known (from
// placeContentNodes) — builds the road looping past them plus all the
// scatter decoration, keeping decoration clear of the road. `spawnDir` is
// included as the road's first waypoint so it visibly starts right where
// the character lands, instead of the road existing somewhere the player
// has to stumble onto.
export function decoratePlanet(planetHandle, radius, nodeDirs, accentColor, spawnDir) {
  const { group, rand } = planetHandle;

  const waypoints = spawnDir ? [spawnDir, ...nodeDirs] : nodeDirs;
  const roadPoints = waypoints.length >= 2 ? buildRoadPath(radius, waypoints) : [];
  if (roadPoints.length) {
    group.add(buildRoadMesh(roadPoints, radius));
  }

  const decorCount = 46;
  for (let i = 0; i < decorCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
    const surfacePos = dir.clone().multiplyScalar(radius);
    if (roadPoints.length && distanceToRoad(surfacePos, roadPoints) < 1.6) continue;

    const roll = rand();
    let deco3d;
    if (roll < 0.55) deco3d = buildTree(rand);
    else deco3d = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + rand() * 0.5, 0), rockMat);
    deco3d.position.copy(surfacePos);
    deco3d.lookAt(dir.clone().multiplyScalar(radius + 2));
    deco3d.rotateX(Math.PI / 2);
    deco3d.rotateZ(rand() * Math.PI * 2);
    deco3d.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    group.add(deco3d);
  }

  // dense low-poly grass via InstancedMesh — cheap even at a few thousand blades
  const bladeGeo = new THREE.PlaneGeometry(0.16, 0.5);
  bladeGeo.translate(0, 0.25, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x5fbf5a, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const bladeCount = 2200;
  const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
  const dummy = new THREE.Object3D();
  let placed = 0;
  let attempts = 0;
  while (placed < bladeCount && attempts < bladeCount * 3) {
    attempts++;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
    const pos = dir.clone().multiplyScalar(radius);
    if (roadPoints.length && distanceToRoad(pos, roadPoints) < 1.0) continue;
    dummy.position.copy(pos);
    dummy.lookAt(dir.clone().multiplyScalar(radius + 2));
    dummy.rotateX(Math.PI / 2);
    dummy.rotateZ(rand() * Math.PI * 2);
    const s = 0.7 + rand() * 0.7;
    dummy.scale.set(s, s * (0.8 + rand() * 0.5), s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  group.add(grass);

  // a small distant skyline, clustered opposite the spawn point (far from
  // both where the player lands and the node cluster), echoing the
  // reference's background city silhouette
  const skylineDir = spawnDir ? spawnDir.clone().negate() : new THREE.Vector3(0, -1, 0);
  const skylineBase = new THREE.Vector3().crossVectors(skylineDir, new THREE.Vector3(0, 1, 0)).normalize();
  if (skylineBase.lengthSq() < 0.01) skylineBase.set(1, 0, 0);
  const skylineBase2 = new THREE.Vector3().crossVectors(skylineDir, skylineBase).normalize();
  for (let i = 0; i < 8; i++) {
    const spread = (rand() - 0.5) * 1.1;
    const spread2 = (rand() - 0.5) * 1.1;
    const dir = skylineDir.clone()
      .addScaledVector(skylineBase, spread)
      .addScaledVector(skylineBase2, spread2)
      .normalize();
    const pos = dir.clone().multiplyScalar(radius);
    const building = buildBuilding(rand, accentColor);
    building.position.copy(pos);
    building.lookAt(dir.clone().multiplyScalar(radius + 2));
    building.rotateX(Math.PI / 2);
    group.add(building);
  }
}

// Places each content "node" as a glowing monument standing on the sphere
// surface, spaced out evenly (golden-angle spiral) rather than randomly so
// they don't clump — and so the road built afterward has a sensible loop to
// follow. Returns [{ mesh, worldPos, dir, node }].
export function placeContentNodes(group, nodes, radius, accentColor) {
  const placed = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodes.length; i++) {
    // Kept away from y=1 (the north pole, where the character always
    // spawns) so the nearest monument is a real walk away instead of
    // landing right on top of it — the whole point of exploring first.
    const y = 0.5 - (i / Math.max(1, nodes.length - 1)) * 1.0;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
    const pos = dir.clone().multiplyScalar(radius);

    const monument = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x1c2530, roughness: 0.6 }));
    monument.add(base);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 1.1, roughness: 0.3 })
    );
    pillar.position.y = 1.05;
    monument.add(pillar);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 1.6 }));
    orb.position.y = 2.05;
    monument.add(orb);
    const light = new THREE.PointLight(accentColor, 2, 10, 2);
    light.position.y = 2.1;
    monument.add(light);

    monument.position.copy(pos);
    monument.lookAt(dir.clone().multiplyScalar(radius + 2));
    monument.rotateX(Math.PI / 2);
    monument.castShadow = true;
    group.add(monument);

    placed.push({ mesh: monument, worldPos: pos, dir, node: nodes[i] });
  }
  return placed;
}
