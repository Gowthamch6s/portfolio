import * as THREE from 'three';

const deco = {
  rock: new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 }),
  crystal: new THREE.MeshStandardMaterial({ color: 0x7cf0ff, roughness: 0.2, metalness: 0.3, emissive: 0x1fd7e8, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }),
};

// One low-poly walkable planet surface, radius `radius`, themed by `data`
// (color drives ground + crystal tint). Scatter decoration is placed via a
// deterministic PRNG so the same planet always looks the same.
export function buildTinyPlanet(data, radius = 20) {
  const group = new THREE.Group();

  const groundColor = new THREE.Color(data.color).lerp(new THREE.Color(0xffffff), 0.35);
  const ground = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 4),
    new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.85, flatShading: true })
  );
  ground.receiveShadow = true;
  ground.castShadow = true;
  group.add(ground);

  let seed = data.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const decorCount = 26;
  for (let i = 0; i < decorCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
    const surfacePos = dir.clone().multiplyScalar(radius);

    let deco3d;
    if (rand() < 0.45) {
      deco3d = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rand() * 0.6, 0), deco.rock);
    } else {
      deco3d = new THREE.Mesh(new THREE.ConeGeometry(0.15 + rand() * 0.2, 0.8 + rand() * 0.8, 5), deco.crystal);
    }
    deco3d.position.copy(surfacePos);
    deco3d.lookAt(dir.clone().multiplyScalar(radius + 2));
    deco3d.rotateX(Math.PI / 2);
    deco3d.castShadow = true;
    group.add(deco3d);
  }

  return group;
}

// Places each content "node" as a glowing monument standing on the sphere
// surface, spaced out evenly (golden-angle spiral) rather than randomly so
// they don't clump. Returns [{ mesh, worldPos, node }].
export function placeContentNodes(group, nodes, radius, accentColor) {
  const placed = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodes.length; i++) {
    const y = 1 - (i / Math.max(1, nodes.length - 1)) * 1.4; // keep away from the exact poles
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

    placed.push({ mesh: monument, worldPos: pos, node: nodes[i] });
  }
  return placed;
}
