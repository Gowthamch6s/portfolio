import * as THREE from 'three';

// A chase camera for tiny-planet walking: the usual "behind and above"
// follow cam, but built entirely from the character's own local `up`/
// `forward` vectors instead of world Y — on a sphere, "above" means
// "further out along up," which is a different direction at every point on
// the surface.
export class PlanetCamera {
  constructor(camera) {
    this.camera = camera;
  }

  update(dt, character) {
    const up = character.up;
    const forward = character.forward;
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const charWorldPos = up.clone().multiplyScalar(character.radius + character.height);
    const desired = charWorldPos.clone()
      .add(up.clone().multiplyScalar(3.2))
      .add(forward.clone().multiplyScalar(-6.5));

    this.camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    this.camera.up.lerp(up, 1 - Math.exp(-8 * dt)).normalize();

    const lookTarget = charWorldPos.clone().add(up.clone().multiplyScalar(1.2)).add(forward.clone().multiplyScalar(4));
    this.camera.lookAt(lookTarget);
  }
}
