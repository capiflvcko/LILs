import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Player } from './Player';
import { loadWorld } from './World';
import { CameraManager } from './CameraManager';

const PIXEL_SCALE = 2;

function resizeRenderer(renderer: THREE.WebGLRenderer) {
  const width = Math.max(320, Math.floor(window.innerWidth / PIXEL_SCALE));
  const height = Math.max(180, Math.floor(window.innerHeight / PIXEL_SCALE));

  renderer.setSize(width, height, false);
  renderer.domElement.style.width = `${window.innerWidth}px`;
  renderer.domElement.style.height = `${window.innerHeight}px`;
}

export async function initScene() {
  await RAPIER.init();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  resizeRenderer(renderer);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.domElement.style.imageRendering = 'pixelated';
  document.body.appendChild(renderer.domElement);

  const gravity = { x: 0, y: -9.81, z: 0 };
  const rapierWorld = new RAPIER.World(gravity);

  const { spawn, tick, interaction } = await loadWorld(scene, rapierWorld);

  const player = new Player(rapierWorld, spawn);
  scene.add(player.mesh);

  const cameraManager = new CameraManager(player);

  window.addEventListener('resize', () => {
    cameraManager.handleResize();
    resizeRenderer(renderer);
  });

  return {
    scene,
    renderer,
    player,
    rapierWorld,
    cameraManager,
    worldTick: tick,
    worldInteraction: interaction
  };
}
