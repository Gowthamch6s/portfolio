import * as THREE from 'three';
import { damp } from '../../utils/mathUtils.js';

// A close chase cam sitting just behind and above the console, looking out
// over the bow — the closest a real-time follow camera can get to the
// reference image's over-the-console first-person framing while still
// giving enough peripheral view to steer around islands/whirlpool.
export class BoatCamera {
  constructor(camera) {
    this.camera = camera;
    // Local to the boat: bow tip is at local z≈+3.4, console/windshield sits
    // around z≈0.5-0.7, stern/engine around z≈-2. Sitting the camera at
    // z≈-0.6 (just behind the console, roughly where a driver would stand)
    // looking toward the bow is what actually gives the "over the console"
    // POV — an earlier version placed the camera behind the stern entirely,
    // which put the whole hull between the camera and the horizon.
    this.offset = new THREE.Vector3(0, 1.85, -0.6);
    this.lookOffset = new THREE.Vector3(0, 1.1, 14);
    this.shakeSeed = Math.random() * 1000;
  }

  update(dt, boat) {
    const yaw = boat.heading;
    const rotatedOffset = this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const desiredPos = boat.mesh.position.clone().add(rotatedOffset);

    const speed01 = Math.min(1, Math.abs(boat.speed) / 26);
    const shake = Math.sin(this.shakeSeed + performance.now() * 0.02) * 0.02 * speed01;
    desiredPos.y += shake;

    this.camera.position.lerp(desiredPos, 1 - Math.exp(-6 * dt));

    const rotatedLook = this.lookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const lookTarget = boat.mesh.position.clone().add(rotatedLook);
    const currentLook = this._currentLook || lookTarget.clone();
    currentLook.x = damp(currentLook.x, lookTarget.x, 7, dt);
    currentLook.y = damp(currentLook.y, lookTarget.y, 7, dt);
    currentLook.z = damp(currentLook.z, lookTarget.z, 7, dt);
    this._currentLook = currentLook;
    this.camera.lookAt(currentLook);

    this.camera.fov = 62 + speed01 * 8;
    this.camera.updateProjectionMatrix();
  }
}
