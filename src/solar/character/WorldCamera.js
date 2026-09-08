import * as THREE from 'three';

// Standard third-person chase camera — behind and above the character,
// looking at a point slightly ahead. World-Y-up throughout, unlike the
// tiny-planet version this replaces.
export class WorldCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 3.2, -6);
    this.lookOffset = new THREE.Vector3(0, 1.4, 6);
  }

  update(dt, character) {
    const rotatedOffset = this.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), character.heading);
    const desired = character.position.clone().add(rotatedOffset);
    this.camera.position.lerp(desired, 1 - Math.exp(-6 * dt));
    this.camera.up.set(0, 1, 0);

    const rotatedLook = this.lookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), character.heading);
    const lookTarget = character.position.clone().add(rotatedLook);
    this.camera.lookAt(lookTarget);
  }
}
