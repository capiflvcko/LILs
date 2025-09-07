import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Player } from './Player';
import { loadWorld } from './World';
import { CameraManager } from './CameraManager';

export async function initScene() {
  await RAPIER.init();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  const gravity = { x: 0, y: -9.81, z: 0 };
  const rapierWorld = new RAPIER.World(gravity);

  const player = new Player(rapierWorld);
  scene.add(player.mesh);

  const cameraManager = new CameraManager(player);

  await loadWorld(scene, rapierWorld);

  window.addEventListener('resize', () => {
    cameraManager.camera.aspect = window.innerWidth / window.innerHeight;
    cameraManager.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, renderer, player, rapierWorld, cameraManager };
}
