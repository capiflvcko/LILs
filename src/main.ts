import * as THREE from 'three';
import { initScene } from './scene';
import { playAIGeneratedSong } from './audio/stream';
import { MarketplaceUI } from './ui/MarketplaceUI';
import { SkateboardMenuUI } from './ui/SkateboardMenuUI';

async function start() {
  const { scene, renderer, player, rapierWorld, cameraManager, worldTick, worldInteraction } = await initScene();
  cameraManager.update();
  const INTRO_READ_MS = 12000;
  const INTRO_HIDE_AFTER_ACTIVITY_MS = 1600;
  const INTRO_MIN_READ_MS = 4500;

  const getAudioPosition = () => {
    const position = player.mesh.position.clone();
    position.y += 0.8;
    return position;
  };

  const marketplaceUI = new MarketplaceUI(async songId => {
    await playAIGeneratedSong(songId, getAudioPosition());
  });
  marketplaceUI.hide();

  const skateboardMenu = new SkateboardMenuUI();
  const raycaster = new THREE.Raycaster();
  const pointerStart = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let pointerActive = false;
  let worldNoteTimeout = 0;
  let clickMoveMarkerTarget: THREE.Vector3 | null = null;
  let pauseStartTime = 0;
  let introHideTimeout = 0;
  let introDismissed = false;
  let paused = false;

  const worldNote = document.createElement('div');
  worldNote.style.position = 'fixed';
  worldNote.style.left = '20px';
  worldNote.style.bottom = '116px';
  worldNote.style.padding = '10px 12px';
  worldNote.style.borderRadius = '6px';
  worldNote.style.background = 'rgba(45, 56, 28, 0.92)';
  worldNote.style.color = '#fff8de';
  worldNote.style.border = '2px solid rgba(171, 202, 112, 0.34)';
  worldNote.style.boxShadow = '8px 8px 0 rgba(27, 34, 17, 0.16)';
  worldNote.style.font = '12px/1.4 "Courier New", monospace';
  worldNote.style.zIndex = '1600';
  worldNote.style.display = 'none';
  document.body.appendChild(worldNote);

  const dayNightOverlay = document.createElement('div');
  dayNightOverlay.style.position = 'fixed';
  dayNightOverlay.style.inset = '0';
  dayNightOverlay.style.pointerEvents = 'none';
  dayNightOverlay.style.zIndex = '2';
  dayNightOverlay.style.opacity = '0';
  dayNightOverlay.style.background = 'linear-gradient(180deg, rgba(77, 110, 188, 0.18) 0%, rgba(9, 17, 34, 0.78) 100%)';
  document.body.appendChild(dayNightOverlay);

  const dayNightChip = document.createElement('div');
  dayNightChip.style.position = 'fixed';
  dayNightChip.style.right = '20px';
  dayNightChip.style.top = '20px';
  dayNightChip.style.padding = '10px 12px';
  dayNightChip.style.borderRadius = '6px';
  dayNightChip.style.background = 'rgba(248, 242, 204, 0.92)';
  dayNightChip.style.border = '3px solid rgba(82, 108, 34, 0.45)';
  dayNightChip.style.boxShadow = '8px 8px 0 rgba(54, 73, 23, 0.18)';
  dayNightChip.style.color = '#2b3718';
  dayNightChip.style.font = '13px/1.4 "Courier New", monospace';
  dayNightChip.style.zIndex = '1000';
  document.body.appendChild(dayNightChip);

  const showWorldNote = (message: string) => {
    worldNote.textContent = message;
    worldNote.style.display = 'block';
    window.clearTimeout(worldNoteTimeout);
    worldNoteTimeout = window.setTimeout(() => {
      worldNote.style.display = 'none';
    }, 1800);
  };

  const updateHud = () => {
    const hud = document.querySelector('.hud');
    if (!hud) {
      return;
    }

    hud.innerHTML = `
      <div>Arrow keys move or click the ground to move. Click-drag rotates the camera.</div>
      <div>${worldInteraction.isSkateboardMounted() ? 'You are riding the skateboard.' : 'Red skateboard: it is parked near where you spawn.'}</div>
      <div>Cycle: 6 in-game hours, split into 3 hours day and 3 hours night.</div>
      <div>Hover buildings and props to highlight them.</div>
      <div>The studio is at the north end of town.</div>
      <div>Press <kbd>P</kbd> for the demo song, <kbd>M</kbd> for the market, and <kbd>Esc</kbd> to pause.</div>
    `;
  };

  const updateDayNightUi = () => {
    const state = worldInteraction.getDayNightState();
    const hour = Math.floor(state.hour);
    const minute = Math.floor((state.hour - hour) * 60);
    dayNightChip.innerHTML = `
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.7;">Town Cycle</div>
      <div style="font-size:18px;font-weight:700;">${state.label}</div>
      <div>${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} / 06:00</div>
    `;
    dayNightOverlay.style.opacity = `${state.darkness * 0.62}`;
  };

  const mountSkateboard = () => {
    player.setSpeedMultiplier(1.7);
    player.setRidingSkateboard(true);
    worldInteraction.setSkateboardMounted(true);
    updateHud();
    showWorldNote('Board mounted.');
  };

  const instructions = document.getElementById('instructions') ?? document.createElement('div');
  instructions.id = 'instructions';
  if (!instructions.parentElement) {
    document.body.appendChild(instructions);
  }

  const renderInstructions = (isPaused = false) => {
    instructions.innerHTML = isPaused
      ? `
        <strong>Sound World</strong>
        <span>The game is paused. Press Esc to jump back in.</span>
        <span>Arrow keys or click-to-move through the starter town.</span>
        <span>Click and drag to move the camera.</span>
        <span>The town runs on a 6-hour cycle: 3 hours day, 3 hours night.</span>
        <span>Hover houses and props to highlight them.</span>
        <span>The red skateboard is parked near your spawn point.</span>
        <span>Head north to the studio to cut records.</span>
        <span>Press P to play the featured track and M for the market.</span>
      `
      : `
        <strong>Sound World</strong>
        <span>Arrow keys or click-to-move through the starter town.</span>
        <span>Click and drag to move the camera.</span>
        <span>The town runs on a 6-hour cycle: 3 hours day, 3 hours night.</span>
        <span>Hover houses and props to highlight them.</span>
        <span>The red skateboard is parked near your spawn point.</span>
        <span>Head north to the studio to cut records.</span>
        <span>Press P to play the featured track.</span>
        <span>Press M to open the market board.</span>
        <span>Press Esc to pause and bring this screen back.</span>
      `;
    instructions.classList.toggle('paused', isPaused);
  };

  const setInstructionsVisible = (visible: boolean) => {
    instructions.classList.toggle('hidden', !visible);
    instructions.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  const clearIntroHideTimer = () => {
    window.clearTimeout(introHideTimeout);
    introHideTimeout = 0;
  };

  const scheduleIntroHide = (delayMs: number) => {
    if (paused || introDismissed) {
      return;
    }

    clearIntroHideTimer();
    introHideTimeout = window.setTimeout(() => {
      if (paused) {
        return;
      }

      introDismissed = true;
      renderInstructions(false);
      setInstructionsVisible(false);
    }, delayMs);
  };

  const noteGameplayActivity = () => {
    if (paused || introDismissed) {
      return;
    }

    const elapsed = performance.now() - pauseStartTime;
    if (elapsed >= INTRO_MIN_READ_MS) {
      scheduleIntroHide(INTRO_HIDE_AFTER_ACTIVITY_MS);
    }
  };

  const setPaused = (nextPaused: boolean) => {
    if (paused === nextPaused) {
      return;
    }

    paused = nextPaused;
    pointerActive = false;
    worldInteraction.setHoverTarget(null);

    if (paused) {
      clearIntroHideTimer();
      player.halt();
      renderInstructions(true);
      setInstructionsVisible(true);
      showWorldNote('Paused. Press Esc to resume.');
      return;
    }

    renderInstructions(false);
    if (introDismissed) {
      setInstructionsVisible(false);
    } else {
      pauseStartTime = performance.now();
      setInstructionsVisible(true);
      scheduleIntroHide(3000);
    }
  };

  const getPointerNdc = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  };

  const resolveHoverTarget = (event: PointerEvent) => {
    const pointer = getPointerNdc(event);
    raycaster.setFromCamera(pointer, cameraManager.camera);
    const hits = raycaster.intersectObjects(worldInteraction.hoverTargets, true);
    if (hits.length === 0) {
      return null;
    }

    return (hits[0].object.userData.hoverRoot as THREE.Object3D | undefined) ?? null;
  };

  const updateHoverTarget = (event: PointerEvent) => {
    if (skateboardMenu.isVisible()) {
      worldInteraction.setHoverTarget(null);
      return;
    }

    worldInteraction.setHoverTarget(resolveHoverTarget(event));
  };

  const tryOpenSkateboardMenu = (event: PointerEvent) => {
    const pointer = getPointerNdc(event);
    raycaster.setFromCamera(pointer, cameraManager.camera);
    const hits = raycaster.intersectObject(worldInteraction.skateboardHitTarget, true);
    if (hits.length === 0) {
      return false;
    }

    if (!worldInteraction.canOpenSkateboardMenu(player.mesh.position)) {
      showWorldNote('Walk up to the skateboard first.');
      return true;
    }

    skateboardMenu.show(() => {
      mountSkateboard();
    });
    return true;
  };

  const tryMovePlayer = (event: PointerEvent) => {
    const hoverTarget = resolveHoverTarget(event);
    worldInteraction.setHoverTarget(hoverTarget);
    if (hoverTarget) {
      return;
    }

    const pointer = getPointerNdc(event);
    raycaster.setFromCamera(pointer, cameraManager.camera);
    const hits = raycaster.intersectObject(worldInteraction.clickMoveHitTarget, false);
    if (hits.length === 0) {
      return;
    }

    const destination = hits[0].point.clone();
    destination.y = player.mesh.position.y;
    clickMoveMarkerTarget = destination.clone();
    player.setClickMoveTarget(destination);
    worldInteraction.setMoveMarker(destination);
  };

  renderer.domElement.addEventListener('pointerdown', event => {
    if (paused || event.button !== 0) {
      return;
    }

    noteGameplayActivity();
    pointerActive = true;
    pointerStart.set(event.clientX, event.clientY);
    pointerCurrent.copy(pointerStart);
  });

  renderer.domElement.addEventListener('pointermove', event => {
    if (paused) {
      worldInteraction.setHoverTarget(null);
      return;
    }

    if (!pointerActive) {
      updateHoverTarget(event);
    } else {
      pointerCurrent.set(event.clientX, event.clientY);
      updateHoverTarget(event);
    }
  });

  renderer.domElement.addEventListener('pointerup', event => {
    if (paused || event.button !== 0 || !pointerActive) {
      return;
    }

    noteGameplayActivity();
    pointerCurrent.set(event.clientX, event.clientY);
    const dragDistance = pointerCurrent.distanceTo(pointerStart);
    pointerActive = false;

    if (dragDistance > 8 || skateboardMenu.isVisible()) {
      return;
    }

    if (tryOpenSkateboardMenu(event)) {
      return;
    }

    tryMovePlayer(event);
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    pointerActive = false;
    worldInteraction.setHoverTarget(null);
  });

  function animate() {
    requestAnimationFrame(animate);

    if (paused || skateboardMenu.isVisible()) {
      player.halt();
    } else {
      player.update(cameraManager.getMovementQuaternion());
      rapierWorld.step();
      player.syncVisual();
      cameraManager.update();
      worldTick(player.mesh.position, cameraManager.camera.position);
      updateDayNightUi();
    }

    if (paused) {
      player.syncVisual();
      cameraManager.update();
    }

    renderer.render(scene, cameraManager.camera);

    if (clickMoveMarkerTarget && player.mesh.position.distanceTo(clickMoveMarkerTarget) < 0.9) {
      clickMoveMarkerTarget = null;
      worldInteraction.setMoveMarker(null);
    }
  }

  window.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
      if (skateboardMenu.isVisible()) {
        return;
      }

      setPaused(!paused);
      return;
    }

    if (paused) {
      return;
    }

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      noteGameplayActivity();
    }

    if (e.key.toLowerCase() === 'p') {
      try {
        await playAIGeneratedSong('song1', getAudioPosition());
        await marketplaceUI.refreshData();
      } catch (err) {
        console.error('Audio demo failed:', err);
      }
    }

    if (e.key.toLowerCase() === 'm') {
      marketplaceUI.toggle();
    }

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      clickMoveMarkerTarget = null;
      worldInteraction.setMoveMarker(null);
    }
  });

  pauseStartTime = performance.now();
  renderInstructions(false);
  setInstructionsVisible(true);
  scheduleIntroHide(INTRO_READ_MS);
  updateHud();

  animate();
}

start();
