import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

// Drives the whole day/night look from one `factor` value (0 = full day,
// 1 = full night): the physical Sky shader's sun elevation, a separate moon
// disc + soft light for when the sun dips below the horizon (Sky.js has no
// built-in night support), a starfield that fades in, fog color, and the
// directional "sun/moon" light's color+intensity. Call `update(dt)` every
// frame to ease toward whatever `setTarget()` was last asked for — this is
// what makes the console's Day/Night button feel like a real transition
// instead of an instant snap.
export class DayNightSky {
  constructor(scene) {
    this.scene = scene;
    this.factor = 0; // current, eased
    this.target = 0; // 0 day .. 1 night

    this.sky = new Sky();
    this.sky.scale.setScalar(3000);
    scene.add(this.sky);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 3.2;
    u.rayleigh.value = 1.6;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.82;

    this.sunDir = new THREE.Vector3();

    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 3.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -400;
    this.sunLight.shadow.camera.right = 400;
    this.sunLight.shadow.camera.top = 400;
    this.sunLight.shadow.camera.bottom = -400;
    this.sunLight.shadow.camera.far = 1200;
    this.sunLight.shadow.bias = -0.0005;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x1a3a4a, 0.7);
    scene.add(this.hemi);
    this._hemiDay = new THREE.Color(0xbfe3ff);
    this._hemiNight = new THREE.Color(0x203a55);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(this.ambient);

    // moon: soft emissive disc + a gentle point light, hidden during the day
    const moonGeo = new THREE.SphereGeometry(28, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xeaf2ff, fog: false });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moon);
    this.moonLight = new THREE.PointLight(0xaac8ff, 0, 2200, 1.4);
    scene.add(this.moonLight);

    // simple starfield, opacity driven by night factor
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 1400 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85); // keep them up in the sky, not underfoot
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 60;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0, fog: false });
    this.stars = new THREE.Points(starGeo, this.starMat);
    scene.add(this.stars);

    this.fogDay = new THREE.Color(0xbfe3ff);
    this.fogNight = new THREE.Color(0x050a18);
    scene.fog = new THREE.FogExp2(this.fogDay.getHex(), 0.0016);

    this._applyFactor(0);
  }

  setTarget(t) {
    this.target = THREE.MathUtils.clamp(t, 0, 1);
  }

  toggle() {
    this.setTarget(this.target > 0.5 ? 0 : 1);
    return this.target;
  }

  update(dt) {
    if (Math.abs(this.factor - this.target) > 0.0005) {
      this.factor = THREE.MathUtils.damp(this.factor, this.target, 1.4, dt);
      this._applyFactor(this.factor);
    }
  }

  _applyFactor(f) {
    // Sun sweeps from high overhead (day) down toward the horizon, but is
    // clamped to stay just above it (never negative). three.js's Sky shader
    // (Preetham model) and Water.js's reflection both produce harsh banding
    // artifacts once sunPosition.y goes below the horizon — it's simply not
    // defined for night. The moon, stars, and fog/light dimming below do all
    // the actual "looks like night" work instead, so the physical sun can
    // stay in its valid range the whole time.
    const elevation = THREE.MathUtils.lerp(48, 1.5, f);
    const azimuth = 200;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sunDir.setFromSphericalCoords(1, phi, theta);
    this.sky.material.uniforms.sunPosition.value.copy(this.sunDir);
    // hazier, dimmer atmosphere as it "sets" — sells darkness despite the
    // physical sun angle staying just above the horizon (see note above)
    this.sky.material.uniforms.turbidity.value = THREE.MathUtils.lerp(3.2, 12, f);
    this.sky.material.uniforms.rayleigh.value = THREE.MathUtils.lerp(1.6, 0.35, f);

    const sunAltitude = Math.max(0, this.sunDir.y);
    this.sunLight.position.copy(this.sunDir).multiplyScalar(600);
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.intensity = THREE.MathUtils.lerp(3.4, 0.05, f) * (0.35 + sunAltitude);
    this.sunLight.color.setHSL(0.11, 0.7, THREE.MathUtils.lerp(0.75, 0.4, f));
    this.sunLight.castShadow = f < 0.65;

    // moon sits roughly opposite the sun so it's up when the sun isn't
    const moonDir = this.sunDir.clone().multiplyScalar(-1);
    this.moon.position.copy(moonDir).multiplyScalar(1300);
    this.moonLight.position.copy(moonDir).multiplyScalar(500);
    this.moonLight.intensity = THREE.MathUtils.smoothstep(f, 0.35, 0.85) * 2.6;

    this.hemi.intensity = THREE.MathUtils.lerp(0.75, 0.18, f);
    this.hemi.color.copy(this._hemiDay).lerp(this._hemiNight, f);
    this.ambient.intensity = THREE.MathUtils.lerp(0.22, 0.12, f);

    this.starMat.opacity = THREE.MathUtils.smoothstep(f, 0.45, 0.95);

    const fogColor = this.fogDay.clone().lerp(this.fogNight, f);
    this.scene.fog.color.copy(fogColor);
    this.scene.fog.density = THREE.MathUtils.lerp(0.0016, 0.0028, f);
  }
}
