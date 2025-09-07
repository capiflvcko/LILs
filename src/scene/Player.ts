import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

const SPEED = 5;

export class Player {
  public mesh: THREE.Mesh;
  public head: THREE.Object3D;
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private direction = new THREE.Vector3();
  private keys: Record<string, boolean> = {};

  constructor(private world: RAPIER.World) {
    const geometry = new THREE.CapsuleGeometry(0.4, 1.0);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.head = new THREE.Object3D();
    this.head.position.y = 0.9;
    this.mesh.add(this.head);

    const bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased().setTranslation(0, 1, 0);
    this.body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.9, 0.4);
    this.collider = world.createCollider(colliderDesc, this.body);

    window.addEventListener('keydown', e => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', e => (this.keys[e.key.toLowerCase()] = false));
  }

  update() {
    this.direction.set(0, 0, 0);
    if (this.keys['w']) this.direction.z -= 1;
    if (this.keys['s']) this.direction.z += 1;
    if (this.keys['a']) this.direction.x -= 1;
    if (this.keys['d']) this.direction.x += 1;
    this.direction.normalize();

    const move = this.direction.clone().multiplyScalar(SPEED);
    this.body.setLinvel({ x: move.x, y: this.body.linvel().y, z: move.z }, true);

    const t = this.body.translation();
    this.mesh.position.set(t.x, t.y, t.z);
  }
}
