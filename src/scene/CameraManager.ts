import * as THREE from 'three';
import { Player } from './Player';

export class CameraManager {
  public readonly camera: THREE.OrthographicCamera;
  private readonly baseFollowOffset = new THREE.Vector3(1, 0.92, 1).normalize().multiplyScalar(30);
  private readonly lookOffset = new THREE.Vector3(0, 0.75, 0);
  private readonly desiredCameraPosition = new THREE.Vector3();
  private readonly desiredLookTarget = new THREE.Vector3();
  private readonly moveQuaternion = new THREE.Quaternion();
  private readonly snappedCameraPosition = new THREE.Vector3();
  private readonly rotatedOffset = new THREE.Vector3();
  private readonly frustumHeight = 26;
  private readonly dragSensitivity = 0.008;
  private azimuth = Math.PI / 4;
  private isDragging = false;
  private lastPointerX = 0;

  constructor(private readonly player: Player) {
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
    this.handleResize();

    window.addEventListener('mousedown', event => {
      if (event.button !== 0) {
        return;
      }

      this.isDragging = true;
      this.lastPointerX = event.clientX;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', event => {
      if (!this.isDragging) {
        return;
      }

      const deltaX = event.clientX - this.lastPointerX;
      this.lastPointerX = event.clientX;
      this.azimuth -= deltaX * this.dragSensitivity;
    });
  }

  update() {
    this.desiredLookTarget.copy(this.player.mesh.position).add(this.lookOffset);
    this.rotatedOffset.copy(this.baseFollowOffset).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.azimuth);
    this.desiredCameraPosition.copy(this.desiredLookTarget).add(this.rotatedOffset);

    this.camera.position.lerp(this.desiredCameraPosition, 0.14);
    this.snappedCameraPosition.set(
      Math.round(this.camera.position.x * 6) / 6,
      Math.round(this.camera.position.y * 6) / 6,
      Math.round(this.camera.position.z * 6) / 6
    );
    this.camera.position.copy(this.snappedCameraPosition);
    this.camera.lookAt(this.desiredLookTarget);
    this.moveQuaternion.copy(this.camera.quaternion);
  }

  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = (-this.frustumHeight * aspect) / 2;
    this.camera.right = (this.frustumHeight * aspect) / 2;
    this.camera.top = this.frustumHeight / 2;
    this.camera.bottom = -this.frustumHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  getMovementQuaternion(): THREE.Quaternion {
    return this.moveQuaternion;
  }
}
