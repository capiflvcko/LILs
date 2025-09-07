import * as THREE from 'three';
import { Player } from './Player';

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  private isFirstPerson = true;
  private thirdPersonOffset = new THREE.Vector3(0, 2, -5);

  constructor(private player: Player) {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'v') this.isFirstPerson = !this.isFirstPerson;
    });
  }

  update() {
    if (this.isFirstPerson) {
      this.camera.position.copy(
        this.player.head.getWorldPosition(new THREE.Vector3())
      );
      this.camera.quaternion.copy(
        this.player.head.getWorldQuaternion(new THREE.Quaternion())
      );
    } else {
      const behind = this.thirdPersonOffset
        .clone()
        .applyQuaternion(this.player.mesh.quaternion);
      this.camera.position.copy(this.player.mesh.position.clone().add(behind));
      this.camera.lookAt(this.player.mesh.position);
    }
  }
}

