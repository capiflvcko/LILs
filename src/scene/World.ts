import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export async function loadWorld(scene: THREE.Scene, world: RAPIER.World) {
  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const groundCollider = RAPIER.ColliderDesc.cuboid(500, 0.1, 500);
  world.createCollider(groundCollider, groundBody);
}
