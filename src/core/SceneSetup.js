import * as THREE from 'three';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // PCFSoftShadowMap is deprecated in this three.js version
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function createCamera() {
  // far=2200 comfortably covers the mountain ring (up to ~1150 radius + peak base radius),
  // which the shorter 1200 plane used to hard-clip before fog ever got a chance to fade it.
  return new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2200);
}

// Warm low-angle "setting alpine sun" as the key light, plus a cool blue hemisphere/ambient
// pairing so shadowed snow reads as blue-tinted rather than flat grey.
export function createLights(scene) {
  const sun = new THREE.DirectionalLight(0xfff1d8, 3.2);
  sun.position.set(80, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  sun.shadow.bias = -0.0015;

  const sky = new THREE.HemisphereLight(0xaecdff, 0xe8f1ff, 0.9);
  const fill = new THREE.AmbientLight(0xbfd8ff, 0.25);

  scene.add(sun, sky, fill);
  return { sun, sky, fill };
}

export function createSky(scene) {
  scene.background = new THREE.Color(0xbfe3ff);
  scene.fog = new THREE.Fog(0xdcefff, 80, 620);
}

export function setupResize(camera, renderer, onResize) {
  function applySize(width, height) {
    if (width <= 0 || height <= 0) return; // guards against a 0x0 layout pass before first paint
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    onResize?.(width, height);
  }

  // ResizeObserver (rather than a plain window "resize" listener + one synchronous call)
  // guarantees a correctly-sized first frame even if layout hasn't settled the moment this
  // module runs — a plain window.innerWidth read at import time can still be 0 in some hosts.
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    applySize(Math.round(width), Math.round(height));
  });
  observer.observe(document.body);

  applySize(window.innerWidth, window.innerHeight);
  return observer;
}
