import { initScene } from './scene';

async function start() {
  const { scene, renderer, player, rapierWorld, cameraManager } = await initScene();

  function animate() {
    requestAnimationFrame(animate);
    rapierWorld.step();
    player.update();
    cameraManager.update();
    renderer.render(scene, cameraManager.camera);
  }

  animate();
}

start();
