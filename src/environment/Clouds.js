import * as THREE from 'three';

const CLOUD_COUNT = 18;
const PUFFS_PER_CLOUD_MIN = 4;
const PUFFS_PER_CLOUD_MAX = 7;
const BOUNDS = 1000; // half-extent of the square region clouds drift within before wrapping
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 220;

// Classic low-poly "cluster of puffed-up spheres" cloud look. All puffs across every cloud
// share one InstancedMesh (one draw call); each cloud is just a center position + drift
// velocity, and every frame each puff's world matrix is recomputed as center + its fixed
// local offset — cheap for the ~18 clouds x ~5 puffs this scene actually has.
export class Clouds {
  constructor(scene) {
    this.clouds = Array.from({ length: CLOUD_COUNT }, () => this._buildCloud());
    this.totalPuffs = this.clouds.reduce((sum, c) => sum + c.puffs.length, 0);

    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, fog: false }),
      this.totalPuffs
    );

    this._dummy = new THREE.Object3D();
    this._writeAllMatrices();
    scene.add(this.mesh);
  }

  _buildCloud() {
    const angle = Math.random() * Math.PI * 2;
    const windAngle = Math.PI * 0.15 + (Math.random() - 0.5) * 0.3; // mostly one shared drift direction
    const speed = 1.2 + Math.random() * 2.2;

    const puffCount = PUFFS_PER_CLOUD_MIN + Math.floor(Math.random() * (PUFFS_PER_CLOUD_MAX - PUFFS_PER_CLOUD_MIN));
    const puffs = Array.from({ length: puffCount }, (_, i) => ({
      offset: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 8),
      scale: 3 + Math.random() * 4.5,
    }));

    return {
      center: new THREE.Vector3(Math.cos(angle) * BOUNDS * Math.random(), HEIGHT_MIN + Math.random() * (HEIGHT_MAX - HEIGHT_MIN), Math.sin(angle) * BOUNDS * Math.random()),
      velocity: new THREE.Vector3(Math.cos(windAngle) * speed, 0, Math.sin(windAngle) * speed),
      puffs,
    };
  }

  _writeAllMatrices() {
    let index = 0;
    for (const cloud of this.clouds) {
      for (const puff of cloud.puffs) {
        this._dummy.position.copy(cloud.center).add(puff.offset);
        this._dummy.scale.setScalar(puff.scale);
        this._dummy.rotation.set(0, 0, 0);
        this._dummy.updateMatrix();
        this.mesh.setMatrixAt(index, this._dummy.matrix);
        index++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(dt) {
    for (const cloud of this.clouds) {
      cloud.center.addScaledVector(cloud.velocity, dt);

      if (cloud.center.x > BOUNDS) cloud.center.x = -BOUNDS;
      else if (cloud.center.x < -BOUNDS) cloud.center.x = BOUNDS;
      if (cloud.center.z > BOUNDS) cloud.center.z = -BOUNDS;
      else if (cloud.center.z < -BOUNDS) cloud.center.z = BOUNDS;
    }
    this._writeAllMatrices();
  }
}
