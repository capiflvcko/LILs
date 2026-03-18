import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

const NPC_FRONT_YAW = Math.PI / 2;

type PixelTexturePainter = (ctx: CanvasRenderingContext2D) => void;

type BuildingConfig = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  wallColor: number;
  roofColor: number;
  trimColor: number;
  doorColor: number;
  windowColor: number;
  awningColor?: number;
  labelTexture?: THREE.Texture;
};

type NpcStyle = 'cap' | 'hoodie' | 'producer' | 'dj' | 'fighter';

type NpcAxis = 'idle' | 'x' | 'z';

type NpcView = 'front' | 'back' | 'side';

type NpcViewFrames = {
  idle: THREE.Texture;
  stepLeft: THREE.Texture;
  stepRight: THREE.Texture;
};

type NpcFrames = Record<NpcView, NpcViewFrames>;

type NpcInstance = {
  group: THREE.Group;
  spriteRig: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  shadow: THREE.Mesh;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;
  frames: NpcFrames;
  basePosition: THREE.Vector3;
  scale: number;
  axis: NpcAxis;
  travel: number;
  speed: number;
  phase: number;
  facingBias: 1 | -1;
  bodyYaw: number;
  targetBodyYaw: number;
};

type BuildingOccluder = {
  box: THREE.Box3;
  materials: Array<THREE.MeshBasicMaterial | THREE.MeshToonMaterial>;
};

type TrafficCar = {
  group: THREE.Group;
  body: RAPIER.RigidBody;
  axis: 'x' | 'z';
  lane: number;
  travelMin: number;
  travelMax: number;
  speed: number;
  direction: 1 | -1;
  phase: number;
};

function wrapAngle(angle: number) {
  return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
}

export type WorldInteraction = {
  skateboardHitTarget: THREE.Object3D;
  hoverTargets: THREE.Object3D[];
  clickMoveHitTarget: THREE.Object3D;
  canOpenSkateboardMenu: (playerPos: THREE.Vector3) => boolean;
  setSkateboardMounted: (mounted: boolean) => void;
  isSkateboardMounted: () => boolean;
  setHoverTarget: (target: THREE.Object3D | null) => void;
  setMoveMarker: (position: THREE.Vector3 | null) => void;
  getDayNightState: () => {
    label: 'Day' | 'Night';
    hour: number;
    darkness: number;
  };
};

const TILE_SIZE = 4;

function createNearestTexture(
  width: number,
  height: number,
  painter: PixelTexturePainter
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create pixel texture');
  }

  ctx.imageSmoothingEnabled = false;
  painter(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createGrassTexture() {
  const texture = createNearestTexture(128, 128, ctx => {
    ctx.fillStyle = '#82c86e';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#75bb61';
    for (let y = 0; y < 128; y += 8) {
      for (let x = (y / 8) % 2 === 0 ? 0 : 4; x < 128; x += 8) {
        ctx.fillRect(x, y, 4, 4);
      }
    }

    ctx.strokeStyle = '#93d17e';
    ctx.lineWidth = 1;
    for (let x = -128; x <= 256; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 128, 128);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 128, 128);
      ctx.stroke();
    }

    ctx.fillStyle = '#a6df8d';
    for (let i = 0; i < 24; i += 1) {
      const px = (i * 19) % 120;
      const py = (i * 37) % 120;
      ctx.fillRect(px + 2, py + 1, 2, 2);
    }
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  return texture;
}

function createRoadTexture() {
  const texture = createNearestTexture(96, 96, ctx => {
    ctx.fillStyle = '#8e877d';
    ctx.fillRect(0, 0, 96, 96);

    ctx.fillStyle = '#7e766c';
    for (let y = 0; y < 96; y += 12) {
      for (let x = 0; x < 96; x += 12) {
        ctx.fillRect(x, y, 11, 11);
      }
    }

    ctx.fillStyle = '#a59d91';
    for (let y = 2; y < 96; y += 12) {
      for (let x = ((y / 12) % 2) * 6 + 2; x < 96; x += 12) {
        ctx.fillRect(x, y, 4, 4);
      }
    }

    ctx.strokeStyle = '#6d665d';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 96; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(96, y);
      ctx.stroke();
    }
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

function createPlazaTexture() {
  const texture = createNearestTexture(96, 96, ctx => {
    ctx.fillStyle = '#ddd5bb';
    ctx.fillRect(0, 0, 96, 96);

    ctx.fillStyle = '#d0c7ac';
    for (let y = 0; y < 96; y += 16) {
      for (let x = 0; x < 96; x += 16) {
        ctx.fillRect(x, y, 15, 15);
      }
    }

    ctx.strokeStyle = '#b8af94';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 96; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 96);
      ctx.stroke();
    }
    for (let y = 0; y <= 96; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(96, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#efe7cc';
    for (let i = 0; i < 18; i += 1) {
      const px = (i * 17) % 90;
      const py = (i * 23) % 90;
      ctx.fillRect(px + 3, py + 3, 3, 3);
    }
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function createTreeTexture() {
  return createNearestTexture(40, 44, ctx => {
    ctx.clearRect(0, 0, 40, 44);

    ctx.fillStyle = '#6b4326';
    ctx.fillRect(17, 21, 6, 17);
    ctx.fillRect(15, 28, 4, 8);
    ctx.fillRect(21, 31, 4, 6);

    ctx.fillStyle = '#2f6f3d';
    ctx.fillRect(10, 8, 20, 8);
    ctx.fillRect(6, 12, 28, 8);
    ctx.fillRect(8, 4, 10, 6);
    ctx.fillRect(22, 4, 10, 6);
    ctx.fillRect(12, 16, 16, 8);

    ctx.fillStyle = '#5fd06c';
    ctx.fillRect(12, 8, 16, 4);
    ctx.fillRect(8, 12, 24, 4);
    ctx.fillRect(10, 5, 6, 3);
    ctx.fillRect(24, 5, 6, 3);
    ctx.fillRect(14, 16, 12, 4);

    ctx.fillStyle = '#8fe489';
    ctx.fillRect(16, 8, 4, 3);
    ctx.fillRect(20, 12, 4, 3);
    ctx.fillRect(14, 13, 3, 3);
  });
}

function createBushTexture() {
  return createNearestTexture(24, 16, ctx => {
    ctx.clearRect(0, 0, 24, 16);

    ctx.fillStyle = '#2c6a37';
    ctx.fillRect(2, 8, 20, 6);
    ctx.fillRect(5, 5, 14, 5);
    ctx.fillRect(8, 2, 8, 4);

    ctx.fillStyle = '#67cf6c';
    ctx.fillRect(4, 8, 16, 4);
    ctx.fillRect(7, 5, 10, 3);
    ctx.fillRect(10, 3, 4, 2);
  });
}

function createFlowerTexture() {
  return createNearestTexture(18, 12, ctx => {
    ctx.clearRect(0, 0, 18, 12);

    ctx.fillStyle = '#2d7a3b';
    ctx.fillRect(3, 5, 2, 5);
    ctx.fillRect(8, 4, 2, 6);
    ctx.fillRect(13, 5, 2, 5);

    ctx.fillStyle = '#ffd669';
    ctx.fillRect(2, 3, 4, 3);
    ctx.fillRect(7, 2, 4, 3);
    ctx.fillRect(12, 3, 4, 3);

    ctx.fillStyle = '#ff8f7b';
    ctx.fillRect(4, 2, 2, 2);
    ctx.fillRect(9, 1, 2, 2);
    ctx.fillRect(14, 2, 2, 2);
  });
}

function createShadowTexture(kind: 'tree' | 'blob') {
  return createNearestTexture(64, 32, ctx => {
    ctx.clearRect(0, 0, 64, 32);
    ctx.fillStyle = '#ffffff';

    if (kind === 'blob') {
      ctx.fillRect(10, 13, 40, 8);
      ctx.fillRect(16, 9, 28, 4);
      ctx.fillRect(20, 21, 20, 3);
      return;
    }

    ctx.fillRect(8, 13, 46, 9);
    ctx.fillRect(18, 8, 26, 5);
    ctx.fillRect(12, 10, 10, 4);
    ctx.fillRect(42, 9, 10, 4);
    ctx.fillRect(28, 5, 8, 4);
  });
}

function createLabelTexture(text: string, accent: string) {
  return createNearestTexture(120, 30, ctx => {
    ctx.clearRect(0, 0, 120, 30);
    ctx.fillStyle = '#2c2630';
    ctx.fillRect(0, 0, 120, 30);

    ctx.fillStyle = accent;
    ctx.fillRect(4, 4, 24, 22);
    ctx.fillStyle = '#fff4d6';
    ctx.fillRect(9, 9, 14, 12);
    ctx.fillStyle = '#2c2630';
    ctx.fillRect(13, 11, 6, 8);
    ctx.fillStyle = '#fff4d6';
    ctx.fillRect(15, 13, 2, 4);

    ctx.fillStyle = '#fff4d6';
    ctx.font = '700 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 36, 15);
  });
}

function createNpcTexture(
  style: NpcStyle,
  view: NpcView,
  variant: 'idle' | 'step-left' | 'step-right'
) {
  return createNearestTexture(24, 24, ctx => {
    const outline = '#30384d';
    const skin =
      style === 'cap'
        ? '#9c6455'
        : style === 'hoodie'
          ? '#f5c17e'
          : style === 'producer'
            ? '#8f5e40'
            : style === 'fighter'
              ? '#c69477'
              : '#d3a06c';
    const shirt =
      style === 'cap'
        ? '#fff1f3'
        : style === 'hoodie'
          ? '#ecf0f4'
          : style === 'producer'
            ? '#f4ebdf'
            : style === 'fighter'
              ? '#1b273f'
              : '#1f2026';
    const jacket =
      style === 'cap'
        ? '#32497d'
        : style === 'hoodie'
          ? '#434d5e'
          : style === 'producer'
            ? '#6b5cb5'
            : style === 'fighter'
              ? '#2e4f8f'
              : '#cb7d2f';
    const pants =
      style === 'cap'
        ? '#f3567d'
        : style === 'hoodie'
          ? '#353e4d'
          : style === 'producer'
            ? '#26205a'
            : style === 'fighter'
              ? '#79808f'
              : '#2d4e86';
    const shoes =
      style === 'hoodie'
        ? '#f6f8fb'
        : style === 'fighter'
          ? '#f0c74d'
          : '#ffffff';
    const hat =
      style === 'cap'
        ? '#f14973'
        : style === 'producer'
          ? '#5e4fc2'
          : style === 'fighter'
            ? '#7768c8'
            : style === 'dj'
              ? '#2d4056'
              : '#222a37';
    const hatLight =
      style === 'cap'
        ? '#ffdbe7'
        : style === 'producer'
          ? '#dfc75a'
          : style === 'fighter'
            ? '#e3b84a'
            : style === 'dj'
              ? '#7fd6e0'
              : '#565c6d';

    const leftArmY = variant === 'step-left' ? 14 : 15;
    const rightArmY = variant === 'step-right' ? 14 : 15;
    const leftHandY = variant === 'step-left' ? 19 : 18;
    const rightHandY = variant === 'step-right' ? 19 : 18;
    const leftLegX = variant === 'step-left' ? 6 : 7;
    const rightLegX = variant === 'step-right' ? 13 : 12;
    const leftShoeY = variant === 'step-left' ? 22 : 23;
    const rightShoeY = variant === 'step-right' ? 22 : 23;

    ctx.clearRect(0, 0, 24, 24);

    if (view === 'back') {
      if (style === 'cap') {
        ctx.fillStyle = hat;
        ctx.fillRect(7, 2, 8, 4);
        ctx.fillRect(6, 4, 10, 3);
      } else if (style === 'hoodie') {
        ctx.fillStyle = hat;
        ctx.fillRect(7, 2, 8, 3);
        ctx.fillRect(6, 4, 10, 5);
        ctx.fillRect(9, 8, 4, 2);
      } else if (style === 'producer') {
        ctx.fillStyle = hat;
        ctx.fillRect(6, 3, 2, 4);
        ctx.fillRect(15, 3, 2, 4);
        ctx.fillRect(8, 2, 7, 2);
        ctx.fillStyle = hatLight;
        ctx.fillRect(8, 3, 1, 3);
        ctx.fillRect(14, 3, 1, 3);
      } else if (style === 'fighter') {
        ctx.fillStyle = hat;
        ctx.fillRect(8, 2, 6, 3);
        ctx.fillRect(7, 4, 8, 3);
        ctx.fillRect(9, 6, 2, 2);
        ctx.fillRect(12, 5, 2, 2);
      } else {
        ctx.fillStyle = hat;
        ctx.fillRect(7, 3, 7, 4);
        ctx.fillRect(6, 5, 9, 4);
        ctx.fillStyle = hatLight;
        ctx.fillRect(5, 5, 2, 4);
        ctx.fillRect(14, 5, 2, 4);
      }

      ctx.fillStyle = skin;
      ctx.fillRect(9, 12, 4, 2);

      ctx.fillStyle = jacket;
      ctx.fillRect(4, leftArmY, 4, 5);
      ctx.fillRect(15, rightArmY, 4, 5);
      ctx.fillRect(5, 13, 5, 7);
      ctx.fillRect(13, 13, 5, 7);

      ctx.fillStyle = outline;
      ctx.fillRect(8, 13, 1, 6);
      ctx.fillRect(14, 13, 1, 6);
      ctx.fillRect(10, 15, 3, 1);

      ctx.fillStyle = shirt;
      ctx.fillRect(10, 14, 3, 6);

      if (style === 'hoodie') {
        ctx.fillStyle = '#ef4458';
        ctx.fillRect(10, 15, 3, 2);
      }

      if (style === 'fighter') {
        ctx.fillStyle = '#c8d3e9';
        ctx.fillRect(4, 6, 1, 5);
        ctx.fillStyle = '#6b533f';
        ctx.fillRect(3, 5, 2, 6);
      }

      ctx.fillStyle = pants;
      ctx.fillRect(leftLegX, 20, 4, 3);
      ctx.fillRect(rightLegX, 20, 4, 3);

      ctx.fillStyle = shoes;
      ctx.fillRect(leftLegX - 1, leftShoeY, 4, 1);
      ctx.fillRect(rightLegX, rightShoeY, 4, 1);

      if (style === 'fighter') {
        ctx.fillStyle = '#d8a93b';
        ctx.fillRect(leftLegX, leftShoeY - 1, 3, 1);
        ctx.fillRect(rightLegX + 1, rightShoeY - 1, 3, 1);
      }
      return;
    }

    if (view === 'side') {
      const frontLegX = variant === 'step-right' ? 13 : 12;
      const backLegX = variant === 'step-left' ? 8 : 9;
      const frontLegY = variant === 'step-right' ? 19 : 20;
      const backLegY = variant === 'step-left' ? 18 : 20;
      const frontLegHeight = variant === 'step-right' ? 4 : 3;
      const backLegHeight = variant === 'step-left' ? 4 : 3;
      const frontArmY = variant === 'step-left' ? 14 : 15;
      const rearArmY = variant === 'step-right' ? 16 : 15;

      if (style === 'cap') {
        ctx.fillStyle = hat;
        ctx.fillRect(8, 2, 6, 4);
        ctx.fillRect(7, 4, 7, 3);
        ctx.fillRect(14, 5, 4, 2);
        ctx.fillStyle = hatLight;
        ctx.fillRect(11, 3, 2, 2);
      } else if (style === 'hoodie') {
        ctx.fillStyle = hat;
        ctx.fillRect(8, 2, 5, 3);
        ctx.fillRect(7, 4, 7, 5);
        ctx.fillRect(11, 7, 2, 2);
      } else if (style === 'producer') {
        ctx.fillStyle = hat;
        ctx.fillRect(7, 4, 2, 4);
        ctx.fillRect(9, 2, 5, 2);
        ctx.fillStyle = hatLight;
        ctx.fillRect(9, 3, 1, 3);
        ctx.fillRect(13, 3, 1, 3);
      } else if (style === 'fighter') {
        ctx.fillStyle = hat;
        ctx.fillRect(8, 2, 5, 3);
        ctx.fillRect(7, 4, 6, 3);
        ctx.fillRect(9, 6, 2, 2);
        ctx.fillStyle = hatLight;
        ctx.fillRect(14, 2, 2, 3);
      } else {
        ctx.fillStyle = hat;
        ctx.fillRect(8, 3, 5, 4);
        ctx.fillRect(7, 5, 6, 4);
        ctx.fillStyle = hatLight;
        ctx.fillRect(6, 5, 2, 4);
      }

      ctx.fillStyle = skin;
      ctx.fillRect(8, 8, 6, 5);
      ctx.fillRect(11, 13, 3, 2);

      ctx.fillStyle = outline;
      ctx.fillRect(9, 9, 2, 1);
      ctx.fillRect(10, 11, 3, 1);

      ctx.fillStyle = jacket;
      ctx.fillRect(6, frontArmY, 4, 5);
      ctx.fillRect(13, rearArmY, 3, 4);
      ctx.fillRect(7, 13, 7, 7);

      ctx.fillStyle = skin;
      ctx.fillRect(6, variant === 'step-left' ? 19 : 18, 2, 1);
      ctx.fillRect(14, 18, 2, 1);

      ctx.fillStyle = shirt;
      ctx.fillRect(10, 13, 3, 7);

      if (style === 'hoodie') {
        ctx.fillStyle = '#ef4458';
        ctx.fillRect(10, 15, 3, 2);
        ctx.fillRect(9, 16, 5, 1);
      }

      if (style === 'producer') {
        ctx.fillStyle = '#f39b59';
        ctx.fillRect(11, 14, 1, 4);
      }

      if (style === 'dj') {
        ctx.fillStyle = '#66d7d4';
        ctx.fillRect(10, 14, 3, 2);
      }

      if (style === 'fighter') {
        ctx.fillStyle = '#f2e4be';
        ctx.fillRect(10, 14, 3, 5);
        ctx.fillStyle = '#516278';
        ctx.fillRect(9, 14, 1, 4);
        ctx.fillStyle = '#c8d3e9';
        ctx.fillRect(5, 7, 1, 5);
        ctx.fillStyle = '#6b533f';
        ctx.fillRect(4, 6, 2, 6);
      }

      ctx.fillStyle = pants;
      ctx.fillRect(backLegX, backLegY, 3, backLegHeight);
      ctx.fillRect(frontLegX, frontLegY, 4, frontLegHeight);

      ctx.fillStyle = shoes;
      ctx.fillRect(backLegX - 1, variant === 'step-left' ? 22 : 23, 4, 1);
      ctx.fillRect(frontLegX - 1, variant === 'step-right' ? 22 : 23, 5, 1);

      if (style === 'fighter') {
        ctx.fillStyle = '#d8a93b';
        ctx.fillRect(frontLegX, variant === 'step-right' ? 21 : 22, 3, 1);
        ctx.fillRect(backLegX, variant === 'step-left' ? 21 : 22, 2, 1);
      }
      return;
    }

    if (style === 'cap') {
      ctx.fillStyle = hat;
      ctx.fillRect(6, 2, 8, 4);
      ctx.fillRect(5, 4, 10, 4);
      ctx.fillRect(13, 5, 6, 2);
      ctx.fillStyle = hatLight;
      ctx.fillRect(11, 3, 3, 3);
      ctx.fillStyle = outline;
      ctx.fillRect(10, 7, 1, 1);
    } else if (style === 'hoodie') {
      ctx.fillStyle = hat;
      ctx.fillRect(7, 2, 7, 3);
      ctx.fillRect(6, 4, 9, 4);
      ctx.fillRect(9, 7, 3, 3);
      ctx.fillRect(12, 5, 3, 2);
    } else if (style === 'producer') {
      ctx.fillStyle = hat;
      ctx.fillRect(5, 4, 2, 4);
      ctx.fillRect(14, 4, 2, 4);
      ctx.fillRect(7, 2, 7, 2);
      ctx.fillStyle = hatLight;
      ctx.fillRect(7, 3, 1, 3);
      ctx.fillRect(13, 3, 1, 3);
      ctx.fillStyle = '#3b355a';
      ctx.fillRect(7, 4, 6, 3);
    } else if (style === 'fighter') {
      ctx.fillStyle = hat;
      ctx.fillRect(8, 2, 6, 3);
      ctx.fillRect(7, 4, 8, 3);
      ctx.fillRect(9, 6, 2, 2);
      ctx.fillRect(12, 5, 2, 2);

      ctx.fillStyle = hatLight;
      ctx.fillRect(15, 2, 2, 3);
      ctx.fillRect(16, 4, 2, 2);

      ctx.fillStyle = '#6b533f';
      ctx.fillRect(4, 5, 2, 6);
      ctx.fillRect(5, 4, 1, 1);
      ctx.fillStyle = '#c8d3e9';
      ctx.fillRect(5, 6, 1, 5);
    } else {
      ctx.fillStyle = hat;
      ctx.fillRect(7, 3, 7, 4);
      ctx.fillRect(6, 5, 9, 4);
      ctx.fillStyle = hatLight;
      ctx.fillRect(5, 5, 2, 4);
      ctx.fillRect(14, 5, 2, 4);
      ctx.fillStyle = '#4b5d74';
      ctx.fillRect(9, 1, 4, 2);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(7, 8, 8, 5);
    ctx.fillRect(9, 13, 4, 2);

    ctx.fillStyle = outline;
    ctx.fillRect(9, 9, 1, 1);
    ctx.fillRect(13, 9, 1, 1);
    ctx.fillRect(10, 11, 3, 1);

    ctx.fillStyle = jacket;
    ctx.fillRect(4, leftArmY, 4, 5);
    ctx.fillRect(15, rightArmY, 4, 5);
    ctx.fillRect(5, 13, 5, 7);
    ctx.fillRect(13, 13, 5, 7);

    ctx.fillStyle = skin;
    ctx.fillRect(4, leftHandY, 2, 1);
    ctx.fillRect(17, rightHandY, 2, 1);

    ctx.fillStyle = shirt;
    ctx.fillRect(10, 13, 3, 7);

    if (style === 'hoodie') {
      ctx.fillStyle = '#ef4458';
      ctx.fillRect(10, 15, 3, 2);
      ctx.fillRect(9, 16, 5, 2);
      ctx.fillRect(10, 18, 1, 1);
      ctx.fillRect(12, 18, 1, 1);
    }

    if (style === 'producer') {
      ctx.fillStyle = '#f39b59';
      ctx.fillRect(11, 14, 1, 4);
      ctx.fillRect(10, 17, 3, 1);
    }

    if (style === 'dj') {
      ctx.fillStyle = '#66d7d4';
      ctx.fillRect(10, 14, 3, 2);
      ctx.fillRect(9, 16, 5, 1);
    }

    if (style === 'fighter') {
      ctx.fillStyle = '#f2e4be';
      ctx.fillRect(10, 14, 3, 5);
      ctx.fillStyle = '#516278';
      ctx.fillRect(9, 14, 1, 4);
      ctx.fillRect(13, 14, 1, 4);
      ctx.fillStyle = '#4a596a';
      ctx.fillRect(8, 16, 2, 1);
      ctx.fillRect(13, 16, 2, 1);
    }

    ctx.fillStyle = pants;
    ctx.fillRect(leftLegX, 20, 4, 3);
    ctx.fillRect(rightLegX, 20, 4, 3);

    ctx.fillStyle = shoes;
    ctx.fillRect(leftLegX - 1, leftShoeY, 4, 1);
    ctx.fillRect(rightLegX, rightShoeY, 4, 1);

    if (style === 'fighter') {
      ctx.fillStyle = '#d8a93b';
      ctx.fillRect(leftLegX, leftShoeY - 1, 3, 1);
      ctx.fillRect(rightLegX + 1, rightShoeY - 1, 3, 1);
    }
  });
}

function createSkateboardTexture() {
  return createNearestTexture(36, 14, ctx => {
    ctx.clearRect(0, 0, 36, 14);

    ctx.fillStyle = '#ef5a55';
    ctx.fillRect(5, 4, 26, 5);
    ctx.fillRect(7, 3, 22, 1);
    ctx.fillRect(7, 9, 22, 1);
    ctx.fillRect(3, 5, 2, 3);
    ctx.fillRect(31, 5, 2, 3);

    ctx.fillStyle = '#b81f2f';
    ctx.fillRect(7, 4, 4, 5);
    ctx.fillRect(25, 4, 4, 5);
    ctx.fillRect(14, 5, 8, 3);

    ctx.fillStyle = '#4f5666';
    ctx.fillRect(9, 9, 2, 2);
    ctx.fillRect(25, 9, 2, 2);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(7, 11, 4, 2);
    ctx.fillRect(25, 11, 4, 2);
  });
}

export async function loadWorld(scene: THREE.Scene, world: RAPIER.World) {
  const cycleHours = 6;
  const dayHours = 3;
  const cycleDurationSeconds = 180;
  const dayBackground = new THREE.Color(0xa8d9ff);
  const nightBackground = new THREE.Color(0x0f1b3f);
  const dayFogColor = new THREE.Color(0xa8d9ff);
  const nightFogColor = new THREE.Color(0x162346);
  const daySkyLight = new THREE.Color(0xfff8df);
  const nightSkyLight = new THREE.Color(0x7b97e6);
  const dayGroundLight = new THREE.Color(0x66806a);
  const nightGroundLight = new THREE.Color(0x16223f);
  const daySunColor = new THREE.Color(0xfff1c8);
  const nightSunColor = new THREE.Color(0x7ea0ff);
  const backgroundColor = dayBackground.clone();
  const fogColor = dayFogColor.clone();
  let daylight = 1;
  let dayNightLabel: 'Day' | 'Night' = 'Day';
  let cycleHour = 0;

  scene.background = backgroundColor;
  scene.fog = new THREE.Fog(fogColor, 72, 150);

  const hemi = new THREE.HemisphereLight(0xfff8df, 0x66806a, 1.3);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1c8, 1.45);
  sun.position.set(26, 38, 14);
  sun.target.position.set(0, 0, -8);
  scene.add(sun);
  scene.add(sun.target);

  const moon = new THREE.DirectionalLight(0x86a9ff, 0.08);
  moon.position.set(-22, 24, -18);
  moon.target.position.set(0, 0, 6);
  scene.add(moon);
  scene.add(moon.target);

  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  groundBody.userData = 'ground';
  world.createCollider(RAPIER.ColliderDesc.cuboid(90, 0.5, 90), groundBody);

  const grassTexture = createGrassTexture();
  const roadTexture = createRoadTexture();
  const plazaTexture = createPlazaTexture();
  const treeTexture = createTreeTexture();
  const bushTexture = createBushTexture();
  const flowerTexture = createFlowerTexture();
  const treeShadowTexture = createShadowTexture('tree');
  const blobShadowTexture = createShadowTexture('blob');
  const studioLabelTexture = createLabelTexture('STUDIO', '#ff8d64');
  const skateboardTexture = createSkateboardTexture();
  const npcFrames = {
    cap: {
      front: {
        idle: createNpcTexture('cap', 'front', 'idle'),
        stepLeft: createNpcTexture('cap', 'front', 'step-left'),
        stepRight: createNpcTexture('cap', 'front', 'step-right')
      },
      back: {
        idle: createNpcTexture('cap', 'back', 'idle'),
        stepLeft: createNpcTexture('cap', 'back', 'step-left'),
        stepRight: createNpcTexture('cap', 'back', 'step-right')
      },
      side: {
        idle: createNpcTexture('cap', 'side', 'idle'),
        stepLeft: createNpcTexture('cap', 'side', 'step-left'),
        stepRight: createNpcTexture('cap', 'side', 'step-right')
      }
    },
    hoodie: {
      front: {
        idle: createNpcTexture('hoodie', 'front', 'idle'),
        stepLeft: createNpcTexture('hoodie', 'front', 'step-left'),
        stepRight: createNpcTexture('hoodie', 'front', 'step-right')
      },
      back: {
        idle: createNpcTexture('hoodie', 'back', 'idle'),
        stepLeft: createNpcTexture('hoodie', 'back', 'step-left'),
        stepRight: createNpcTexture('hoodie', 'back', 'step-right')
      },
      side: {
        idle: createNpcTexture('hoodie', 'side', 'idle'),
        stepLeft: createNpcTexture('hoodie', 'side', 'step-left'),
        stepRight: createNpcTexture('hoodie', 'side', 'step-right')
      }
    },
    producer: {
      front: {
        idle: createNpcTexture('producer', 'front', 'idle'),
        stepLeft: createNpcTexture('producer', 'front', 'step-left'),
        stepRight: createNpcTexture('producer', 'front', 'step-right')
      },
      back: {
        idle: createNpcTexture('producer', 'back', 'idle'),
        stepLeft: createNpcTexture('producer', 'back', 'step-left'),
        stepRight: createNpcTexture('producer', 'back', 'step-right')
      },
      side: {
        idle: createNpcTexture('producer', 'side', 'idle'),
        stepLeft: createNpcTexture('producer', 'side', 'step-left'),
        stepRight: createNpcTexture('producer', 'side', 'step-right')
      }
    },
    fighter: {
      front: {
        idle: createNpcTexture('fighter', 'front', 'idle'),
        stepLeft: createNpcTexture('fighter', 'front', 'step-left'),
        stepRight: createNpcTexture('fighter', 'front', 'step-right')
      },
      back: {
        idle: createNpcTexture('fighter', 'back', 'idle'),
        stepLeft: createNpcTexture('fighter', 'back', 'step-left'),
        stepRight: createNpcTexture('fighter', 'back', 'step-right')
      },
      side: {
        idle: createNpcTexture('fighter', 'side', 'idle'),
        stepLeft: createNpcTexture('fighter', 'side', 'step-left'),
        stepRight: createNpcTexture('fighter', 'side', 'step-right')
      }
    },
    dj: {
      front: {
        idle: createNpcTexture('dj', 'front', 'idle'),
        stepLeft: createNpcTexture('dj', 'front', 'step-left'),
        stepRight: createNpcTexture('dj', 'front', 'step-right')
      },
      back: {
        idle: createNpcTexture('dj', 'back', 'idle'),
        stepLeft: createNpcTexture('dj', 'back', 'step-left'),
        stepRight: createNpcTexture('dj', 'back', 'step-right')
      },
      side: {
        idle: createNpcTexture('dj', 'side', 'idle'),
        stepLeft: createNpcTexture('dj', 'side', 'step-left'),
        stepRight: createNpcTexture('dj', 'side', 'step-right')
      }
    }
  };

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshBasicMaterial({ map: grassTexture })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  scene.add(ground);

  const clickMoveHitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  clickMoveHitTarget.rotation.x = -Math.PI / 2;
  clickMoveHitTarget.position.y = 0.02;
  scene.add(clickMoveHitTarget);

  const shadowDirection = new THREE.Vector3(-1.28, 0, 0.92).normalize();
  const shadowAngle = Math.atan2(shadowDirection.z, shadowDirection.x);
  const hoverTargets: THREE.Object3D[] = [];
  const buildingOccluders: BuildingOccluder[] = [];
  let activeHoverTarget: THREE.Object3D | null = null;
  let moveMarkerTarget: THREE.Vector3 | null = null;
  const occlusionRay = new THREE.Ray();
  const occlusionHitPoint = new THREE.Vector3();

  const addPatch = (
    texture: THREE.Texture,
    width: number,
    depth: number,
    x: number,
    z: number,
    y = 0.01
  ) => {
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, y, z);
    scene.add(patch);
    return patch;
  };

  const addRoadStripe = (
    x: number,
    z: number,
    width: number,
    depth: number,
    color = 0xf6e59a,
    opacity = 0.88,
    y = 0.016
  ) => {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, y, z);
    scene.add(stripe);
    return stripe;
  };

  const addCrosswalk = (x: number, z: number, width: number, depth: number, axis: 'x' | 'z') => {
    const stripeCount = 5;
    const stripeWidth = axis === 'x' ? width / 7 : width;
    const stripeDepth = axis === 'z' ? depth / 7 : depth;
    const gap = axis === 'x' ? width / stripeCount : depth / stripeCount;

    for (let i = -2; i <= 2; i += 1) {
      addRoadStripe(
        axis === 'x' ? x + i * gap : x,
        axis === 'z' ? z + i * gap : z,
        stripeWidth,
        stripeDepth,
        0xf4efe3,
        0.86,
        0.018
      );
    }
  };

  const registerHoverTarget = (object: THREE.Object3D, x: number, z: number, size: number) => {
    object.userData.hoverMeta = {
      position: new THREE.Vector3(x, 0.07, z),
      size
    };
    object.traverse(child => {
      child.userData.hoverRoot = object;
    });
    hoverTargets.push(object);
    return object;
  };

  const addShadow = (
    texture: THREE.Texture,
    position: THREE.Vector3,
    width: number,
    depth: number,
    offset: number,
    opacity = 0.24,
    color = 0x425338
  ) => {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        map: texture,
        color,
        transparent: true,
        opacity,
        alphaTest: 0.05,
        depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = shadowAngle;
    shadow.position.set(
      position.x + shadowDirection.x * offset,
      0.03,
      position.z + shadowDirection.z * offset
    );
    scene.add(shadow);
    return shadow;
  };

  const addSprite = (
    texture: THREE.Texture,
    position: THREE.Vector3,
    width: number,
    height: number
  ) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.12,
        depthWrite: false
      })
    );
    sprite.center.set(0.5, 0);
    sprite.position.copy(position);
    sprite.scale.set(width, height, 1);
    scene.add(sprite);
    return sprite;
  };

  const createNpcSpriteRig = (frames: NpcFrames, scale: number) => {
    const rig = new THREE.Group();
    const materials: THREE.MeshBasicMaterial[] = [];
    const width = scale;
    const height = scale;
    const layerCount = 5;
    const layerSpacing = 0.045;
    const depthTint = new THREE.Color(0x77819a);
    const shellColor = new THREE.Color(0x1d1c26);

    const addLayer = (
      map: THREE.Texture,
      color: THREE.ColorRepresentation,
      zOffset: number,
      opacity = 1,
      widthScale = 1,
      heightScale = 1
    ) => {
      const geometry = new THREE.PlaneGeometry(width * widthScale, height * heightScale);
      geometry.translate(0, (height * heightScale) / 2, 0);

      const material = new THREE.MeshBasicMaterial({
        map,
        color,
        transparent: true,
        alphaTest: 0.12,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = zOffset;
      rig.add(mesh);
      materials.push(material);
    };

    addLayer(frames.front.idle, shellColor, -(layerCount * layerSpacing) * 0.7, 0.78, 1.08, 1.03);

    for (let i = 0; i < layerCount; i += 1) {
      const depth = i / Math.max(1, layerCount - 1);
      const tint = new THREE.Color(0xffffff).lerp(depthTint, (1 - depth) * 0.38);
      const zOffset = (i - (layerCount - 1) / 2) * layerSpacing;
      addLayer(frames.front.idle, tint, zOffset);
    }

    return { rig, materials };
  };

  const addFixedCuboid = (
    x: number,
    y: number,
    z: number,
    halfX: number,
    halfY: number,
    halfZ: number
  ) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(halfX, halfY, halfZ), body);
  };

  const addFixedCylinder = (x: number, z: number, radius: number, halfHeight: number) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(x, halfHeight, z)
    );
    world.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, radius), body);
  };

  const addCar = (
    x: number,
    z: number,
    rotation: number,
    bodyColor: number,
    roofColor: number,
    accentColor: number
  ) => {
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.9),
      new THREE.MeshBasicMaterial({
        color: 0x2d3135,
        transparent: true,
        opacity: 0.12
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = 0.24;
    shadow.position.set(-0.04, 0.04, 0.08);
    group.add(shadow);

    const bodyMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
    const roofMaterial = new THREE.MeshBasicMaterial({ color: roofColor });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xb8edff });
    const trimMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3442 });
    const lightMaterial = new THREE.MeshBasicMaterial({ color: accentColor });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.85), bodyMaterial);
    chassis.position.y = 0.48;
    group.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.72, 1.45), roofMaterial);
    cabin.position.set(-0.08, 1.12, 0);
    group.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 1.18), windowMaterial);
    windshield.position.set(0.86, 1.13, 0);
    group.add(windshield);

    const rearWindow = windshield.clone();
    rearWindow.position.x = -1.02;
    group.add(rearWindow);

    const sideWindowLeft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.1), windowMaterial);
    sideWindowLeft.position.set(-0.1, 1.16, 0.72);
    group.add(sideWindowLeft);

    const sideWindowRight = sideWindowLeft.clone();
    sideWindowRight.position.z = -0.72;
    group.add(sideWindowRight);

    [
      [-1.12, 0.18, 1.02],
      [1.12, 0.18, 1.02],
      [-1.12, 0.18, -1.02],
      [1.12, 0.18, -1.02]
    ].forEach(([wheelX, wheelY, wheelZ]) => {
      const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.28), trimMaterial);
      wheel.position.set(wheelX, wheelY, wheelZ);
      group.add(wheel);
    });

    const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.7), trimMaterial);
    bumperFront.position.set(1.86, 0.38, 0);
    group.add(bumperFront);

    const bumperRear = bumperFront.clone();
    bumperRear.position.x = -1.86;
    group.add(bumperRear);

    const frontLights = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 1.22), lightMaterial);
    frontLights.position.set(1.98, 0.54, 0);
    group.add(frontLights);

    const tailLights = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 1.22),
      new THREE.MeshBasicMaterial({ color: 0xef6b63 })
    );
    tailLights.position.set(-1.98, 0.54, 0);
    group.add(tailLights);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    registerHoverTarget(group, x, z, 1.55);

    const alongX = Math.abs(Math.cos(rotation)) > 0.7;
    addFixedCuboid(x, 0.75, z, alongX ? 1.9 : 1.05, 0.75, alongX ? 1.05 : 1.9);
  };

  const createTrafficCar = (
    axis: 'x' | 'z',
    lane: number,
    travelMin: number,
    travelMax: number,
    speed: number,
    direction: 1 | -1,
    phase: number,
    bodyColor: number,
    roofColor: number,
    accentColor: number
  ) => {
    const initialProgress = THREE.MathUtils.euclideanModulo(phase, travelMax - travelMin);
    const initialTravel = direction === 1 ? travelMin + initialProgress : travelMax - initialProgress;
    const x = axis === 'x' ? initialTravel : lane;
    const z = axis === 'z' ? initialTravel : lane;
    const rotation =
      axis === 'x'
        ? direction === 1
          ? 0
          : Math.PI
        : direction === 1
          ? -Math.PI / 2
          : Math.PI / 2;

    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.9),
      new THREE.MeshBasicMaterial({
        color: 0x2d3135,
        transparent: true,
        opacity: 0.1
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = 0.24;
    shadow.position.set(-0.04, 0.04, 0.08);
    group.add(shadow);

    const bodyMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
    const roofMaterial = new THREE.MeshBasicMaterial({ color: roofColor });
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xb8edff });
    const trimMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3442 });
    const lightMaterial = new THREE.MeshBasicMaterial({ color: accentColor });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.85), bodyMaterial);
    chassis.position.y = 0.48;
    group.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.72, 1.45), roofMaterial);
    cabin.position.set(-0.08, 1.12, 0);
    group.add(cabin);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 1.18), windowMaterial);
    windshield.position.set(0.86, 1.13, 0);
    group.add(windshield);

    const rearWindow = windshield.clone();
    rearWindow.position.x = -1.02;
    group.add(rearWindow);

    const sideWindowLeft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.1), windowMaterial);
    sideWindowLeft.position.set(-0.1, 1.16, 0.72);
    group.add(sideWindowLeft);

    const sideWindowRight = sideWindowLeft.clone();
    sideWindowRight.position.z = -0.72;
    group.add(sideWindowRight);

    [
      [-1.12, 0.18, 1.02],
      [1.12, 0.18, 1.02],
      [-1.12, 0.18, -1.02],
      [1.12, 0.18, -1.02]
    ].forEach(([wheelX, wheelY, wheelZ]) => {
      const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.28), trimMaterial);
      wheel.position.set(wheelX, wheelY, wheelZ);
      group.add(wheel);
    });

    const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.7), trimMaterial);
    bumperFront.position.set(1.86, 0.38, 0);
    group.add(bumperFront);

    const bumperRear = bumperFront.clone();
    bumperRear.position.x = -1.86;
    group.add(bumperRear);

    const frontLights = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 1.22), lightMaterial);
    frontLights.position.set(1.98, 0.54, 0);
    group.add(frontLights);

    const tailLights = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 1.22),
      new THREE.MeshBasicMaterial({ color: 0xef6b63 })
    );
    tailLights.position.set(-1.98, 0.54, 0);
    group.add(tailLights);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);

    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.75, z)
    );
    body.userData = 'car';
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(axis === 'x' ? 1.9 : 1.05, 0.75, axis === 'x' ? 1.05 : 1.9),
      body
    );

    trafficCars.push({
      group,
      body,
      axis,
      lane,
      travelMin,
      travelMax,
      speed,
      direction,
      phase
    });
  };

  const addTree = (x: number, z: number, scale = 1) => {
    addShadow(
      treeShadowTexture,
      new THREE.Vector3(x, 0, z),
      6.6 * scale,
      2.6 * scale,
      2.3 * scale,
      0.26
    );
    registerHoverTarget(
      addSprite(treeTexture, new THREE.Vector3(x, 0.05, z), 4.8 * scale, 5.4 * scale),
      x,
      z,
      1.55 * scale
    );
    addFixedCylinder(x, z, 0.72 * scale, 1.35 * scale);
  };

  const addBush = (x: number, z: number, scale = 1) => {
    addShadow(
      blobShadowTexture,
      new THREE.Vector3(x, 0, z),
      3.1 * scale,
      1.5 * scale,
      0.8 * scale,
      0.16,
      0x465b3f
    );
    registerHoverTarget(
      addSprite(bushTexture, new THREE.Vector3(x, 0.04, z), 2.2 * scale, 1.4 * scale),
      x,
      z,
      0.92 * scale
    );
    addFixedCylinder(x, z, 0.58 * scale, 0.45 * scale);
  };

  const addFlowers = (x: number, z: number, scale = 1) => {
    addSprite(flowerTexture, new THREE.Vector3(x, 0.03, z), 1.6 * scale, 1 * scale);
  };

  const hoverMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff1a6,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const hoverMarker = new THREE.Mesh(new THREE.RingGeometry(0.72, 1.04, 4), hoverMarkerMaterial);
  hoverMarker.rotation.x = -Math.PI / 2;
  hoverMarker.rotation.z = Math.PI / 4;
  hoverMarker.position.y = 0.07;
  hoverMarker.visible = false;
  scene.add(hoverMarker);

  const hoverFillMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff6d3,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const hoverFill = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), hoverFillMaterial);
  hoverFill.rotation.x = -Math.PI / 2;
  hoverFill.rotation.z = Math.PI / 4;
  hoverFill.position.y = 0.065;
  hoverFill.visible = false;
  scene.add(hoverFill);

  const moveMarkerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff9758,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const moveMarker = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.54, 4), moveMarkerMaterial);
  moveMarker.rotation.x = -Math.PI / 2;
  moveMarker.rotation.z = Math.PI / 4;
  moveMarker.position.y = 0.06;
  moveMarker.visible = false;
  scene.add(moveMarker);

  const trafficCars: TrafficCar[] = [];
  const npcs: NpcInstance[] = [];

  const addNpc = (
    x: number,
    z: number,
    style: NpcStyle,
    axis: NpcAxis,
    travel: number,
    speed: number,
    phase: number,
    facingBias: 1 | -1,
    scale = 2.05
  ) => {
    const group = new THREE.Group();
    group.position.set(x, 0.95, z);
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.95, z)
    );
    body.userData = 'npc';
    const collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(0.38, 0.16).setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL),
      body
    );
    const controller = world.createCharacterController(0.04);
    controller.setUp({ x: 0, y: 1, z: 0 });
    controller.setSlideEnabled(true);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.74),
      new THREE.MeshBasicMaterial({
        color: 0x2c3426,
        transparent: true,
        opacity: 0.22
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = 0.54;
    shadow.position.set(-0.06, -0.86, 0.08);
    group.add(shadow);

    const { rig: spriteRig, materials } = createNpcSpriteRig(npcFrames[style], scale);
    const initialBodyYaw =
      axis === 'x'
        ? facingBias === 1
          ? Math.PI / 2
          : -Math.PI / 2
        : axis === 'z'
          ? facingBias === 1
            ? 0
            : Math.PI
          : facingBias === 1
            ? NPC_FRONT_YAW
            : -NPC_FRONT_YAW;
    spriteRig.position.set(0, -0.72, 0);
    spriteRig.rotation.y = initialBodyYaw;
    group.add(spriteRig);

    scene.add(group);
    npcs.push({
      group,
      spriteRig,
      materials,
      shadow,
      body,
      collider,
      controller,
      frames: npcFrames[style],
      basePosition: group.position.clone(),
      scale,
      axis,
      travel,
      speed,
      phase,
      facingBias,
      bodyYaw: initialBodyYaw,
      targetBodyYaw: initialBodyYaw
    });
  };

  const addLamp = (x: number, z: number) => {
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x4f4a57 });
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff0a6 });
    const group = new THREE.Group();

    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 0.24), poleMaterial);
    pole.position.y = 1.6;
    group.add(pole);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.76), lightMaterial);
    cap.position.y = 3.2;
    group.add(cap);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), poleMaterial);
    base.position.y = 0.13;
    group.add(base);

    group.position.set(x, 0, z);
    scene.add(group);
    registerHoverTarget(group, x, z, 1.15);
    addFixedCuboid(x, 1.6, z, 0.2, 1.6, 0.2);
  };

  const addBench = (x: number, z: number, rotation = 0) => {
    const wood = new THREE.MeshBasicMaterial({ color: 0x8d5f3d });
    const metal = new THREE.MeshBasicMaterial({ color: 0x4f5562 });
    const group = new THREE.Group();

    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 0.7), wood);
    seat.position.y = 0.7;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.2), wood);
    back.position.set(0, 1.15, -0.22);
    group.add(back);

    [-0.9, 0.9].forEach(offset => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), metal);
      leg.position.set(offset, 0.38, 0);
      group.add(leg);
    });

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    registerHoverTarget(group, x, z, 1.45);
    const rotatedQuarterTurn = Math.abs(Math.sin(rotation)) > 0.7;
    addFixedCuboid(x, 0.72, z, rotatedQuarterTurn ? 0.7 : 1.25, 0.72, rotatedQuarterTurn ? 1.25 : 0.7);
  };

  const addCrates = (x: number, z: number) => {
    const group = new THREE.Group();
    const crateMaterial = new THREE.MeshBasicMaterial({ color: 0xbf8a51 });

    [
      { offsetX: 0, offsetZ: 0, size: 0.92 },
      { offsetX: 0.86, offsetZ: 0.12, size: 0.8 },
      { offsetX: 0.34, offsetZ: -0.8, size: 0.74 }
    ].forEach(crate => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(crate.size, crate.size, crate.size),
        crateMaterial
      );
      mesh.position.set(crate.offsetX, crate.size / 2, crate.offsetZ);
      group.add(mesh);
    });

    group.position.set(x, 0, z);
    scene.add(group);
    registerHoverTarget(group, x, z, 1.35);
    addFixedCuboid(x + 0.35, 0.45, z - 0.15, 1.05, 0.45, 1.05);
  };

  const addPlanter = (x: number, z: number, width: number, depth: number) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.6, depth),
      new THREE.MeshBasicMaterial({ color: 0x9b7554 })
    );
    box.position.set(x, 0.3, z);
    scene.add(box);
    registerHoverTarget(box, x, z, Math.max(width, depth) * 0.38);
    addFixedCuboid(x, 0.3, z, width / 2, 0.3, depth / 2);
    addBush(x, z, Math.min(width, depth) * 0.34);
  };

  const addBuilding = ({
    x,
    z,
    width,
    depth,
    height,
    wallColor,
    roofColor,
    trimColor,
    doorColor,
    windowColor,
    awningColor,
    labelTexture
  }: BuildingConfig) => {
    addShadow(
      blobShadowTexture,
      new THREE.Vector3(x, 0, z),
      width + 4,
      depth * 0.8,
      1.9,
      0.18,
      0x3c4a35
    );

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.8, 0.6, depth + 0.8),
      new THREE.MeshBasicMaterial({ color: trimColor })
    );
    foundation.position.y = 0.3;
    group.add(foundation);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshToonMaterial({ color: wallColor })
    );
    body.position.y = height / 2 + 0.3;
    group.add(body);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1.4, 1.2, depth + 1.4),
      new THREE.MeshToonMaterial({ color: roofColor })
    );
    roof.position.y = height + 0.95;
    group.add(roof);

    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.72, 0.46, depth * 0.72),
      new THREE.MeshBasicMaterial({ color: trimColor })
    );
    roofCap.position.y = height + 1.68;
    group.add(roofCap);

    const doorWidth = Math.min(2.2, Math.max(1.4, width * 0.16));
    const doorHeight = Math.min(3.1, Math.max(2.2, height * 0.46));
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.18),
      new THREE.MeshBasicMaterial({ color: doorColor })
    );
    door.position.set(0, doorHeight / 2 + 0.3, depth / 2 + 0.12);
    group.add(door);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 1.4, 0.28, 1.3),
      new THREE.MeshBasicMaterial({ color: awningColor ?? roofColor })
    );
    awning.position.set(0, doorHeight + 0.95, depth / 2 + 0.55);
    group.add(awning);

    const steps = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 1.6, 0.22, 1.4),
      new THREE.MeshBasicMaterial({ color: trimColor })
    );
    steps.position.set(0, 0.11, depth / 2 + 0.82);
    group.add(steps);

    const windowMaterial = new THREE.MeshBasicMaterial({ color: windowColor });
    const windowY = Math.min(height - 0.6, height * 0.58);
    const frontWindowXs = [-width * 0.28, width * 0.28];
    frontWindowXs.forEach(windowX => {
      const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 0.16), windowMaterial);
      frontWindow.position.set(windowX, windowY, depth / 2 + 0.1);
      group.add(frontWindow);

      const backWindow = frontWindow.clone();
      backWindow.position.z = -depth / 2 - 0.1;
      group.add(backWindow);
    });

    [-depth * 0.22, depth * 0.22].forEach(windowZ => {
      const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 1.3), windowMaterial);
      leftWindow.position.set(-width / 2 - 0.1, windowY, windowZ);
      group.add(leftWindow);

      const rightWindow = leftWindow.clone();
      rightWindow.position.x = width / 2 + 0.1;
      group.add(rightWindow);
    });

    let labelSprite: THREE.Sprite | null = null;
    if (labelTexture) {
      labelSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false })
      );
      labelSprite.center.set(0.5, 0);
      labelSprite.position.set(0, height + 2.4, depth / 2 + 1.1);
      labelSprite.scale.set(8.6, 2.1, 1);
      group.add(labelSprite);
    }

    scene.add(group);
    const occluderMaterials: Array<THREE.MeshBasicMaterial | THREE.MeshToonMaterial> = [];
    group.traverse(child => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const materialSet = Array.isArray(child.material) ? child.material : [child.material];
      materialSet.forEach(material => {
        if (!(material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshToonMaterial)) {
          return;
        }

        if (occluderMaterials.includes(material)) {
          return;
        }

        material.transparent = true;
        occluderMaterials.push(material);
      });
    });
    buildingOccluders.push({
      box: new THREE.Box3(
        new THREE.Vector3(x - width * 0.5 - 0.7, 0, z - depth * 0.5 - 0.7),
        new THREE.Vector3(x + width * 0.5 + 0.7, height + 2.4, z + depth * 0.5 + 0.7)
      ),
      materials: occluderMaterials
    });
    registerHoverTarget(group, x, z, Math.max(width, depth) * 0.26);
    addFixedCuboid(x, height / 2 + 0.3, z, width / 2, height / 2 + 0.3, depth / 2);
    return { group, labelSprite };
  };

  addPatch(roadTexture, 18, 84, 0, -6, 0.008);
  addPatch(roadTexture, 72, 16, 0, 2, 0.009);
  addPatch(roadTexture, 4.4, 84, -4.6, -6, 0.012);
  addPatch(roadTexture, 4.4, 84, 4.6, -6, 0.012);
  addPatch(roadTexture, 72, 4.4, 0, -1.8, 0.012);
  addPatch(roadTexture, 72, 4.4, 0, 5.8, 0.012);
  addPatch(plazaTexture, 30, 24, 0, -18, 0.01);
  addPatch(plazaTexture, 12, 10, -18, -8, 0.01);
  addPatch(plazaTexture, 12, 10, 18, -8, 0.01);
  addPatch(plazaTexture, 14, 10, -20, 14, 0.01);
  addPatch(plazaTexture, 14, 10, 20, 14, 0.01);

  addRoadStripe(-8.55, -6, 0.24, 84, 0xd7d0bd, 0.42, 0.013);
  addRoadStripe(8.55, -6, 0.24, 84, 0xd7d0bd, 0.42, 0.013);
  addRoadStripe(0, -5.8, 72, 0.24, 0xd7d0bd, 0.42, 0.013);
  addRoadStripe(0, 9.8, 72, 0.24, 0xd7d0bd, 0.42, 0.013);

  for (let z = -42; z <= 30; z += 6) {
    addRoadStripe(0, z, 0.56, 2.3);
  }

  for (let x = -30; x <= 30; x += 6) {
    addRoadStripe(x, 2, 2.3, 0.56);
  }

  addCrosswalk(0, -22.1, 12.5, 0.9, 'x');
  addCrosswalk(0, 18.2, 12.5, 0.9, 'x');
  addCrosswalk(-12.4, 2, 0.9, 10.5, 'z');
  addCrosswalk(12.4, 2, 0.9, 10.5, 'z');

  const { labelSprite: studioLabel } = addBuilding({
    x: 0,
    z: -30,
    width: 16,
    depth: 11,
    height: 7.2,
    wallColor: 0xe7dcc1,
    roofColor: 0xc46a58,
    trimColor: 0x735645,
    doorColor: 0x41352f,
    windowColor: 0x8be0ff,
    awningColor: 0x2b6f88,
    labelTexture: studioLabelTexture
  });

  addBuilding({
    x: -18,
    z: -8,
    width: 10,
    depth: 8,
    height: 5.4,
    wallColor: 0xf1c98e,
    roofColor: 0x8d5f47,
    trimColor: 0x6d5542,
    doorColor: 0x514137,
    windowColor: 0x9ee5ff,
    awningColor: 0xc2774e
  });

  addBuilding({
    x: 18,
    z: -8,
    width: 10,
    depth: 8,
    height: 5.4,
    wallColor: 0xdab7e6,
    roofColor: 0x6c5577,
    trimColor: 0x554360,
    doorColor: 0x3f3348,
    windowColor: 0xbdf2ff,
    awningColor: 0x4b8ca7
  });

  addBuilding({
    x: -20,
    z: 14,
    width: 11,
    depth: 8,
    height: 5,
    wallColor: 0xf4e1b9,
    roofColor: 0xb56e48,
    trimColor: 0x76533c,
    doorColor: 0x50372a,
    windowColor: 0xa8edff,
    awningColor: 0xd39c53
  });

  addBuilding({
    x: 20,
    z: 14,
    width: 11,
    depth: 8,
    height: 5,
    wallColor: 0xc4e2f6,
    roofColor: 0x5a7aa0,
    trimColor: 0x49617d,
    doorColor: 0x33455c,
    windowColor: 0xe8fdff,
    awningColor: 0x7f99bd
  });

  addCar(-27.8, 12.8, 0, 0x577ab5, 0x394d79, 0xfff0a2);
  addCar(27.8, -8.8, 0, 0xe5c35f, 0xa67231, 0xfff0a2);
  addCar(-14.2, 31.6, Math.PI / 2, 0xd85757, 0x8f2f39, 0xfff0a2);
  addCar(14.2, -42.6, Math.PI / 2, 0x57a59a, 0x356764, 0xfff0a2);

  createTrafficCar('z', -4.6, -44, 30, 6.2, 1, 8.5, 0x6f87d7, 0x455d96, 0xfff0a2);
  createTrafficCar('z', 4.6, -44, 30, 5.6, -1, 22.4, 0xf0c45a, 0xa67c31, 0xfff0a2);
  createTrafficCar('x', -1.8, -34, 34, 5.8, 1, 12.6, 0xd85c58, 0x8a3239, 0xfff0a2);
  createTrafficCar('x', 5.8, -34, 34, 6.4, -1, 31.2, 0x57a999, 0x32695f, 0xfff0a2);

  addPlanter(-5.2, -13.5, 3.2, 1.4);
  addPlanter(5.2, -13.5, 3.2, 1.4);
  addPlanter(-8.8, 9.8, 3, 1.3);
  addPlanter(8.8, 9.8, 3, 1.3);

  [-8, 8].forEach(x => {
    addLamp(x, 18);
    addLamp(x, 8);
    addLamp(x, -4);
    addLamp(x, -16);
  });

  addBench(-7.4, -19, Math.PI / 2);
  addBench(7.4, -19, -Math.PI / 2);
  addBench(-12.5, 4.5, 0);
  addBench(12.5, 4.5, Math.PI);

  addCrates(22.5, -1.5);
  addCrates(-23.5, 17.5);

  [
    [-30, -26, 1.2],
    [-28, -4, 1.1],
    [-31, 20, 1.1],
    [-10, 24, 1],
    [10, 24, 1],
    [31, 20, 1.1],
    [28, -4, 1.1],
    [30, -26, 1.2],
    [0, -44, 1.35]
  ].forEach(([x, z, scale]) => addTree(x, z, scale));

  [
    [-27, -14, 1],
    [-24, 6, 1.05],
    [-8, -25, 0.95],
    [8, -25, 0.95],
    [24, 6, 1.05],
    [27, -14, 1],
    [-4, 24, 0.85],
    [4, 24, 0.85],
    [-33, 7, 0.9],
    [33, 7, 0.9]
  ].forEach(([x, z, scale]) => addBush(x, z, scale));

  [
    [-13, -13],
    [-11, -23],
    [-5, 6],
    [5, 6],
    [11, -23],
    [13, -13],
    [-23, 3],
    [-24, 19],
    [24, 19],
    [23, 3],
    [-8, 18],
    [8, 18]
  ].forEach(([x, z]) => addFlowers(x, z, 1));

  addNpc(-6.5, -17.5, 'cap', 'x', 2.4, 0.82, 0.2, 1, 2.1);
  addNpc(10.5, -10.5, 'hoodie', 'idle', 0, 0.55, 1.3, -1, 2.05);
  addNpc(-19.5, 11.8, 'producer', 'z', 1.5, 0.62, 2.1, 1, 2.02);
  addNpc(18.8, 11.6, 'dj', 'idle', 0, 0.48, 0.9, -1, 2.02);
  addNpc(3.2, -24.4, 'cap', 'x', 1.3, 0.44, 3.2, -1, 1.96);
  addNpc(-3.8, -6.2, 'fighter', 'z', 1.1, 0.36, 1.6, 1, 2.14);

  const skateboardBasePosition = new THREE.Vector3(4.6, 0.08, 20.6);
  let skateboardMounted = false;

  const skateboardShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.9),
    new THREE.MeshBasicMaterial({
      color: 0x24301f,
      transparent: true,
      opacity: 0.18
    })
  );
  skateboardShadow.rotation.x = -Math.PI / 2;
  skateboardShadow.rotation.z = 0.25;
  skateboardShadow.position.copy(skateboardBasePosition);
  skateboardShadow.position.y = 0.04;
  scene.add(skateboardShadow);

  const skateboardBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.82),
    new THREE.MeshBasicMaterial({
      map: skateboardTexture,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    })
  );
  skateboardBoard.rotation.x = -Math.PI / 2;
  skateboardBoard.rotation.z = 0.18;
  skateboardBoard.position.copy(skateboardBasePosition);
  scene.add(skateboardBoard);

  const skateboardHitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  skateboardHitTarget.rotation.x = -Math.PI / 2;
  skateboardHitTarget.rotation.z = Math.PI / 4;
  skateboardHitTarget.position.set(skateboardBasePosition.x, 0.12, skateboardBasePosition.z);
  scene.add(skateboardHitTarget);
  registerHoverTarget(skateboardBoard, skateboardBasePosition.x, skateboardBasePosition.z, 1.28);

  const studioPadMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8b61,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide
  });
  const studioPad = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.8, 4), studioPadMaterial);
  studioPad.rotation.x = -Math.PI / 2;
  studioPad.rotation.z = Math.PI / 4;
  studioPad.position.set(0, 0.06, -22);
  scene.add(studioPad);

  const studioPadFillMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff2c7,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  });
  const studioPadFill = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 2.35),
    studioPadFillMaterial
  );
  studioPadFill.rotation.x = -Math.PI / 2;
  studioPadFill.rotation.z = Math.PI / 4;
  studioPadFill.position.set(0, 0.055, -22);
  scene.add(studioPadFill);

  const selector = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.92, 4),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide
    })
  );
  selector.rotation.x = -Math.PI / 2;
  selector.rotation.z = Math.PI / 4;
  selector.position.y = 0.05;
  scene.add(selector);

  const selectorFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    })
  );
  selectorFill.rotation.x = -Math.PI / 2;
  selectorFill.rotation.z = Math.PI / 4;
  selectorFill.position.y = 0.045;
  scene.add(selectorFill);

  const spawn = new THREE.Vector3(0, 0.95, 22);
  let time = 0;

  function tick(playerPos: THREE.Vector3, cameraPos?: THREE.Vector3) {
    const elapsedSeconds = performance.now() * 0.001;
    const cycleProgress = (elapsedSeconds % cycleDurationSeconds) / cycleDurationSeconds;
    cycleHour = cycleProgress * cycleHours;
    dayNightLabel = cycleHour < dayHours ? 'Day' : 'Night';
    const targetDaylight = dayNightLabel === 'Day' ? 1 : 0;
    daylight = THREE.MathUtils.lerp(daylight, targetDaylight, 0.02);
    time += 0.016;

    const snappedX = Math.round(playerPos.x / TILE_SIZE) * TILE_SIZE;
    const snappedZ = Math.round(playerPos.z / TILE_SIZE) * TILE_SIZE;
    selector.position.set(snappedX, 0.05, snappedZ);
    selectorFill.position.set(snappedX, 0.045, snappedZ);

    backgroundColor.copy(dayBackground).lerp(nightBackground, 1 - daylight);
    fogColor.copy(dayFogColor).lerp(nightFogColor, 1 - daylight);
    hemi.color.copy(daySkyLight).lerp(nightSkyLight, 1 - daylight);
    hemi.groundColor.copy(dayGroundLight).lerp(nightGroundLight, 1 - daylight);
    hemi.intensity = THREE.MathUtils.lerp(1.3, 0.45, 1 - daylight);
    sun.color.copy(daySunColor).lerp(nightSunColor, 1 - daylight);
    sun.intensity = THREE.MathUtils.lerp(1.45, 0.22, 1 - daylight);
    sun.position.set(26, THREE.MathUtils.lerp(18, 38, daylight), 14);
    moon.intensity = THREE.MathUtils.lerp(0.08, 0.62, 1 - daylight);
    moon.position.set(-20, THREE.MathUtils.lerp(18, 28, 1 - daylight), -16);

    studioPadMaterial.opacity = 0.26 + Math.sin(time * 3.1) * 0.08;
    studioPadFillMaterial.opacity = 0.09 + Math.sin(time * 3.1) * 0.04;

    if (studioLabel) {
      studioLabel.position.y = 9.6 + Math.sin(time * 2.2) * 0.18;
    }

    if (skateboardMounted) {
      skateboardBoard.position.set(playerPos.x, 0.11, playerPos.z + 0.12);
      skateboardShadow.position.set(playerPos.x - 0.08, 0.04, playerPos.z + 0.18);
      skateboardHitTarget.position.set(playerPos.x, 0.12, playerPos.z + 0.12);
      (skateboardBoard.userData.hoverMeta as { position: THREE.Vector3; size: number }).position.set(
        playerPos.x,
        0.07,
        playerPos.z + 0.12
      );
    }

    if (activeHoverTarget) {
      const hoverMeta = activeHoverTarget.userData.hoverMeta as { position: THREE.Vector3; size: number };
      hoverMarker.visible = true;
      hoverFill.visible = true;
      hoverMarker.position.set(hoverMeta.position.x, 0.07, hoverMeta.position.z);
      hoverFill.position.set(hoverMeta.position.x, 0.065, hoverMeta.position.z);
      hoverMarker.scale.set(hoverMeta.size, hoverMeta.size, 1);
      hoverFill.scale.set(hoverMeta.size * 0.92, hoverMeta.size * 0.92, 1);
      hoverMarkerMaterial.opacity = 0.66 + Math.sin(time * 5) * 0.08;
      hoverFillMaterial.opacity = 0.12 + Math.sin(time * 5) * 0.03;
    } else {
      hoverMarker.visible = false;
      hoverFill.visible = false;
    }

    if (moveMarkerTarget) {
      moveMarker.visible = true;
      moveMarker.position.set(moveMarkerTarget.x, 0.06, moveMarkerTarget.z);
      moveMarker.scale.setScalar(1 + Math.sin(time * 4.5) * 0.08);
      moveMarkerMaterial.opacity = 0.58 + Math.sin(time * 4.5) * 0.08;
    } else {
      moveMarker.visible = false;
    }

    if (cameraPos) {
      const toPlayer = playerPos.clone().sub(cameraPos);
      const cameraDistance = toPlayer.length();

      if (cameraDistance > 0.001) {
        occlusionRay.origin.copy(cameraPos);
        occlusionRay.direction.copy(toPlayer.normalize());
      }

      buildingOccluders.forEach(occluder => {
        const occludesPlayer =
          cameraDistance > 0.001 &&
          occlusionRay.intersectBox(occluder.box, occlusionHitPoint) !== null &&
          occlusionHitPoint.distanceTo(cameraPos) < cameraDistance - 0.6;
        const targetOpacity = occludesPlayer ? 0.2 : 1;

        occluder.materials.forEach(material => {
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.22);
          material.depthWrite = material.opacity > 0.72;
        });
      });
    }

    trafficCars.forEach(car => {
      const routeLength = car.travelMax - car.travelMin;
      const travel = THREE.MathUtils.euclideanModulo(time * car.speed + car.phase, routeLength);
      const trackPosition = car.direction === 1 ? car.travelMin + travel : car.travelMax - travel;
      const x = car.axis === 'x' ? trackPosition : car.lane;
      const z = car.axis === 'z' ? trackPosition : car.lane;
      const rotation =
        car.axis === 'x'
          ? car.direction === 1
            ? 0
            : Math.PI
          : car.direction === 1
            ? -Math.PI / 2
            : Math.PI / 2;

      car.group.position.set(x, 0, z);
      car.group.rotation.y = rotation;

      const current = car.body.translation();
      car.body.setNextKinematicTranslation({ x, y: current.y, z });
    });

    npcs.forEach(npc => {
      const travelWave = npc.travel > 0 ? Math.sin(time * npc.speed + npc.phase) : 0;
      const bob = Math.sin(time * (npc.speed * 7 + 1.8) + npc.phase) * 0.04;
      const stepPhase = time * (npc.speed * 12 + 2.4) + npc.phase;
      const strideWave = Math.sin(stepPhase);
      const current = npc.body.translation();
      const desiredX = npc.basePosition.x + (npc.axis === 'x' ? travelWave * npc.travel : 0);
      const desiredZ = npc.basePosition.z + (npc.axis === 'z' ? travelWave * npc.travel : 0);
      const desiredStep = new THREE.Vector3(desiredX - current.x, 0, desiredZ - current.z);

      npc.controller.computeColliderMovement(
        npc.collider,
        desiredStep,
        undefined,
        undefined,
        candidate => {
          if (candidate.handle === npc.collider.handle) {
            return false;
          }

          const parentTag = candidate.parent()?.userData;
          return parentTag !== 'ground' && parentTag !== 'npc';
        }
      );

      const correctedStep = npc.controller.computedMovement();
      const correctedMovement = new THREE.Vector3(correctedStep.x, 0, correctedStep.z);
      const nextX = current.x + correctedMovement.x;
      const nextZ = current.z + correctedMovement.z;
      npc.body.setNextKinematicTranslation({ x: nextX, y: current.y, z: nextZ });
      const moving = correctedMovement.lengthSq() > 0.0001;

      npc.group.position.copy(npc.basePosition);
      npc.group.position.x = nextX;
      npc.group.position.z = nextZ;
      npc.group.position.y += bob * 0.24;

      if (moving) {
        npc.targetBodyYaw = Math.atan2(correctedMovement.x, correctedMovement.z);
      }

      npc.bodyYaw = wrapAngle(
        npc.bodyYaw + wrapAngle(npc.targetBodyYaw - npc.bodyYaw) * (moving ? 0.24 : 0.12)
      );

      const hipShift = moving ? strideWave * 0.05 : 0;
      const strideLift = moving ? Math.max(0, strideWave) * 0.03 : 0;
      let activeView: NpcView = 'front';
      let activeViewYaw = npc.bodyYaw;
      let sideMirror: 1 | -1 = 1;

      if (cameraPos) {
        const npcToCamera = new THREE.Vector3(
          cameraPos.x - npc.group.position.x,
          0,
          cameraPos.z - npc.group.position.z
        );

        if (npcToCamera.lengthSq() > 0.0001) {
          npcToCamera.normalize();
          const yaw = Math.atan2(npcToCamera.x, npcToCamera.z);
          const relativeYaw = wrapAngle(yaw - npc.bodyYaw);
          const absRelativeYaw = Math.abs(relativeYaw);

          if (absRelativeYaw <= THREE.MathUtils.degToRad(62)) {
            activeView = 'front';
            activeViewYaw = npc.bodyYaw;
          } else if (absRelativeYaw >= THREE.MathUtils.degToRad(118)) {
            activeView = 'back';
            activeViewYaw = npc.bodyYaw + Math.PI;
          } else {
            activeView = 'side';
            activeViewYaw = npc.bodyYaw + (relativeYaw > 0 ? Math.PI / 2 : -Math.PI / 2);
            sideMirror = relativeYaw > 0 ? -1 : 1;
          }
        }
      }

      npc.spriteRig.position.set(hipShift, -0.72 + bob + strideLift, 0);
      npc.spriteRig.rotation.y = activeViewYaw;
      const sideWidthScale = activeView === 'side' ? 1.2 : 1;
      npc.spriteRig.scale.set(sideMirror * sideWidthScale, 1.02, 1);

      npc.shadow.scale.set(1 - Math.abs(bob) * 2.3, 1, 1 - Math.abs(bob) * 1.8);
      npc.shadow.rotation.z = 0.54 + Math.sin(wrapAngle(npc.targetBodyYaw - npc.bodyYaw)) * 0.05;

      const activeFrames = npc.frames[activeView];
      let frame = activeFrames.idle;
      if (moving) {
        frame = strideWave > 0 ? activeFrames.stepLeft : activeFrames.stepRight;
      }

      npc.materials.forEach(material => {
        if (material.map !== frame) {
          material.map = frame;
          material.needsUpdate = true;
        }
      });
    });
  }

  const interaction: WorldInteraction = {
    skateboardHitTarget,
    hoverTargets,
    clickMoveHitTarget,
    canOpenSkateboardMenu: (playerPos: THREE.Vector3) =>
      !skateboardMounted && playerPos.distanceTo(skateboardBasePosition) < 5.5,
    setSkateboardMounted: (mounted: boolean) => {
      skateboardMounted = mounted;
      if (!mounted) {
        skateboardBoard.position.copy(skateboardBasePosition);
        skateboardShadow.position.set(skateboardBasePosition.x, 0.04, skateboardBasePosition.z);
        skateboardHitTarget.position.set(skateboardBasePosition.x, 0.12, skateboardBasePosition.z);
        (skateboardBoard.userData.hoverMeta as { position: THREE.Vector3; size: number }).position.set(
          skateboardBasePosition.x,
          0.07,
          skateboardBasePosition.z
        );
      }
    },
    isSkateboardMounted: () => skateboardMounted,
    setHoverTarget: (target: THREE.Object3D | null) => {
      activeHoverTarget = target;
    },
    setMoveMarker: (position: THREE.Vector3 | null) => {
      moveMarkerTarget = position ? position.clone() : null;
    },
    getDayNightState: () => ({
      label: dayNightLabel,
      hour: cycleHour,
      darkness: THREE.MathUtils.clamp(1 - daylight, 0, 1)
    })
  };

  return { spawn, tick, interaction };
}
