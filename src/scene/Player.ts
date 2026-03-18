import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

const SPEED = 5;
const FRONT_VIEW_YAW = Math.PI / 2;

type PixelTexturePainter = (ctx: CanvasRenderingContext2D) => void;
type PlayerView = 'front' | 'back' | 'side';

function wrapAngle(angle: number) {
  return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
}

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
    throw new Error('Unable to create player texture');
  }

  ctx.imageSmoothingEnabled = false;
  painter(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createPlayerTexture(view: PlayerView, variant: 'idle' | 'step-left' | 'step-right') {
  return createNearestTexture(48, 72, ctx => {
    const maskDark = '#3a3b40';
    const maskLight = '#56575d';
    const maskEdge = '#28292d';
    const skin = '#7b5031';
    const skinLight = '#9f6d45';
    const eyeWhite = '#f5ecdf';
    const eyeDark = '#34251f';
    const hoodie = '#09090b';
    const hoodieShade = '#17181d';
    const hoodieTrim = '#f3f3f0';
    const shirtPanel = '#1d2028';
    const shirtText = '#f4f3ef';
    const jeans = '#bfe5fb';
    const jeansShade = '#9dcee6';
    const jeansLight = '#e4f6ff';
    const jeansWear = '#8b6d52';
    const shoes = '#f5f7fb';
    const shoesShade = '#c7cfda';
    const sole = '#a9b1be';
    const chain = '#d4d9de';
    const leftArmY = variant === 'step-left' ? 37 : 36;
    const rightArmY = variant === 'step-right' ? 37 : 36;
    const leftHandY = variant === 'step-left' ? 53 : 51;
    const rightHandY = variant === 'step-right' ? 52 : 48;
    const leftLegX =
      view === 'front' || view === 'back'
        ? variant === 'step-left'
          ? 11
          : variant === 'step-right'
            ? 15
            : 14
        : 14;
    const rightLegX =
      view === 'front' || view === 'back'
        ? variant === 'step-right'
          ? 29
          : variant === 'step-left'
            ? 25
            : 26
        : 26;
    const leftLegY = variant === 'step-left' ? 50 : 52;
    const rightLegY = variant === 'step-right' ? 50 : 52;
    const leftLegHeight = variant === 'step-left' ? 16 : 14;
    const rightLegHeight = variant === 'step-right' ? 16 : 14;
    const leftShoeY = variant === 'step-left' ? 65 : 66;
    const rightShoeY = variant === 'step-right' ? 65 : 66;

    ctx.clearRect(0, 0, 48, 72);

    if (view === 'back') {
      const backLeftArmY = variant === 'step-left' ? 37 : 36;
      const backRightArmY = variant === 'step-right' ? 37 : 36;

      ctx.fillStyle = maskDark;
      ctx.fillRect(16, 2, 14, 3);
      ctx.fillRect(15, 5, 16, 3);
      ctx.fillRect(14, 8, 18, 21);
      ctx.fillRect(18, 28, 10, 6);
      ctx.fillStyle = maskEdge;
      ctx.fillRect(14, 8, 1, 21);
      ctx.fillRect(31, 8, 1, 21);

      ctx.fillStyle = maskLight;
      ctx.fillRect(18, 3, 10, 2);
      ctx.fillRect(17, 5, 12, 2);
      ctx.fillRect(17, 9, 12, 16);
      ctx.fillRect(20, 25, 6, 2);

      ctx.fillStyle = hoodie;
      ctx.fillRect(12, 31, 24, 5);
      ctx.fillRect(11, 36, 26, 18);
      ctx.fillRect(7, backLeftArmY, 6, 18);
      ctx.fillRect(35, backRightArmY, 6, 17);
      ctx.fillRect(18, 28, 12, 6);

      ctx.fillStyle = hoodieShade;
      ctx.fillRect(15, 34, 4, 16);
      ctx.fillRect(29, 34, 4, 16);
      ctx.fillRect(22, 31, 4, 20);
      ctx.fillRect(18, 37, 12, 2);
      ctx.fillStyle = hoodieTrim;
      ctx.fillRect(16, 34, 1, 13);
      ctx.fillRect(31, 34, 1, 13);

      ctx.fillStyle = skin;
      ctx.fillRect(21, 35, 6, 4);

      ctx.fillStyle = jeans;
      ctx.fillRect(leftLegX, leftLegY, 8, leftLegHeight);
      ctx.fillRect(rightLegX, rightLegY, 8, rightLegHeight);
      ctx.fillStyle = jeansShade;
      ctx.fillRect(leftLegX + 2, leftLegY, 4, leftLegHeight);
      ctx.fillRect(rightLegX + 2, rightLegY, 4, rightLegHeight);
      ctx.fillStyle = jeansLight;
      ctx.fillRect(leftLegX + 1, leftLegY + 2, 5, 1);
      ctx.fillRect(rightLegX + 1, rightLegY + 2, 5, 1);
      ctx.fillRect(leftLegX + 1, 58, 3, 4);
      ctx.fillRect(rightLegX + 2, 58, 3, 4);
      ctx.fillStyle = jeansWear;
      [
        [leftLegX + 1, 56],
        [leftLegX + 4, 63],
        [rightLegX + 2, 55],
        [rightLegX + 4, 63]
      ].forEach(([x, y]) => {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
      });

      ctx.fillStyle = shoes;
      ctx.fillRect(leftLegX - 2, leftShoeY, 10, 4);
      ctx.fillRect(rightLegX - 2, rightShoeY, 10, 4);
      ctx.fillStyle = shoesShade;
      ctx.fillRect(leftLegX, leftShoeY + 1, 6, 1);
      ctx.fillRect(rightLegX, rightShoeY + 1, 6, 1);
      ctx.fillStyle = sole;
      ctx.fillRect(leftLegX - 1, leftShoeY + 4, 8, 1);
      ctx.fillRect(rightLegX - 1, rightShoeY + 4, 8, 1);
      return;
    }

    if (view === 'side') {
      const frontLegX = variant === 'step-right' ? 25 : 23;
      const backLegX = variant === 'step-left' ? 15 : 17;
      const frontLegY = variant === 'step-right' ? 48 : 51;
      const backLegY = variant === 'step-left' ? 49 : 52;
      const frontLegHeight = variant === 'step-right' ? 18 : 15;
      const backLegHeight = variant === 'step-left' ? 17 : 14;
      const frontArmY = variant === 'step-left' ? 36 : 35;
      const rearArmY = variant === 'step-right' ? 39 : 38;
      const frontShoeY = variant === 'step-right' ? 64 : 66;
      const backShoeY = variant === 'step-left' ? 64 : 66;

      ctx.fillStyle = maskDark;
      ctx.fillRect(16, 2, 13, 3);
      ctx.fillRect(15, 5, 14, 3);
      ctx.fillRect(14, 8, 15, 20);
      ctx.fillRect(18, 28, 8, 6);
      ctx.fillStyle = maskEdge;
      ctx.fillRect(14, 8, 1, 20);
      ctx.fillRect(28, 8, 1, 20);

      ctx.fillStyle = maskLight;
      ctx.fillRect(18, 3, 8, 2);
      ctx.fillRect(17, 5, 9, 2);
      ctx.fillRect(17, 8, 8, 16);

      ctx.fillStyle = skin;
      ctx.fillRect(16, 13, 7, 8);
      ctx.fillRect(22, 35, 4, 5);
      ctx.fillStyle = skinLight;
      ctx.fillRect(16, 13, 3, 5);
      ctx.fillRect(22, 35, 1, 3);

      ctx.fillStyle = eyeWhite;
      ctx.fillRect(17, 14, 3, 2);
      ctx.fillStyle = eyeDark;
      ctx.fillRect(18, 15, 1, 1);
      ctx.fillRect(17, 12, 3, 1);
      ctx.fillRect(16, 17, 1, 2);
      ctx.fillRect(17, 19, 3, 1);

      ctx.fillStyle = hoodie;
      ctx.fillRect(13, 31, 18, 5);
      ctx.fillRect(12, 36, 20, 18);
      ctx.fillRect(11, frontArmY, 6, 18);
      ctx.fillRect(26, rearArmY, 4, 14);
      ctx.fillRect(16, 27, 4, 8);
      ctx.fillRect(20, 28, 8, 6);

      ctx.fillStyle = hoodieShade;
      ctx.fillRect(15, 33, 3, 15);
      ctx.fillRect(25, 34, 3, 14);
      ctx.fillRect(19, 35, 3, 14);
      ctx.fillStyle = hoodieTrim;
      ctx.fillRect(18, 33, 1, 13);
      ctx.fillRect(24, 33, 1, 13);

      ctx.fillStyle = shirtPanel;
      ctx.fillRect(18, 37, 8, 13);
      ctx.fillStyle = shirtText;
      ctx.fillRect(19, 37, 6, 2);
      ctx.fillRect(20, 40, 4, 1);
      ctx.fillStyle = '#f4c85b';
      ctx.fillRect(19, 43, 2, 3);
      ctx.fillStyle = '#d35b61';
      ctx.fillRect(21, 43, 2, 3);
      ctx.fillStyle = '#7bc7f0';
      ctx.fillRect(23, 43, 2, 3);
      ctx.fillStyle = '#f2ede5';
      ctx.fillRect(19, 46, 6, 3);

      ctx.fillStyle = skin;
      ctx.fillRect(12, variant === 'step-left' ? 53 : 51, 4, 4);
      ctx.fillRect(26, 47, 3, 5);
      ctx.fillStyle = chain;
      ctx.fillRect(12, 54, 4, 3);
      ctx.fillRect(15, 50, 2, 1);
      ctx.fillRect(16, 51, 2, 1);

      ctx.fillStyle = jeans;
      ctx.fillRect(backLegX, backLegY, variant === 'step-left' ? 6 : 7, backLegHeight);
      ctx.fillRect(frontLegX, frontLegY, variant === 'step-right' ? 9 : 8, frontLegHeight);
      ctx.fillStyle = jeansShade;
      ctx.fillRect(backLegX + 2, backLegY, 3, backLegHeight);
      ctx.fillRect(frontLegX + 3, frontLegY, 3, frontLegHeight);
      ctx.fillStyle = jeansLight;
      ctx.fillRect(backLegX + 1, backLegY + 1, 1, backLegHeight - 2);
      ctx.fillRect(frontLegX + 1, frontLegY + 1, 1, frontLegHeight - 2);
      ctx.fillStyle = jeansWear;
      [
        [backLegX + 1, 58],
        [frontLegX + 4, 56],
        [frontLegX + 2, 63]
      ].forEach(([x, y]) => {
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
      });

      ctx.fillStyle = shoes;
      ctx.fillRect(backLegX - 1, backShoeY, variant === 'step-left' ? 7 : 8, 4);
      ctx.fillRect(frontLegX - 1, frontShoeY, variant === 'step-right' ? 10 : 9, 4);
      ctx.fillStyle = shoesShade;
      ctx.fillRect(backLegX, backShoeY + 2, 5, 1);
      ctx.fillRect(frontLegX, frontShoeY + 2, 6, 1);
      ctx.fillStyle = sole;
      ctx.fillRect(backLegX, backShoeY + 4, 6, 1);
      ctx.fillRect(frontLegX, frontShoeY + 4, 7, 1);
      return;
    }

    ctx.fillStyle = maskDark;
    ctx.fillRect(16, 2, 14, 3);
    ctx.fillRect(15, 5, 16, 3);
    ctx.fillRect(14, 8, 18, 20);
    ctx.fillRect(16, 28, 14, 7);
    ctx.fillStyle = maskEdge;
    ctx.fillRect(14, 8, 1, 20);
    ctx.fillRect(31, 8, 1, 20);
    ctx.fillRect(16, 28, 1, 7);
    ctx.fillRect(29, 28, 1, 7);

    ctx.fillStyle = maskLight;
    ctx.fillRect(18, 3, 10, 2);
    ctx.fillRect(17, 5, 12, 2);
    ctx.fillRect(16, 8, 5, 16);
    ctx.fillRect(21, 8, 9, 3);
    ctx.fillRect(21, 22, 5, 3);

    ctx.fillStyle = skin;
    ctx.fillRect(17, 13, 13, 6);
    ctx.fillRect(22, 35, 5, 5);
    ctx.fillStyle = skinLight;
    ctx.fillRect(18, 13, 4, 4);
    ctx.fillRect(24, 35, 1, 3);

    ctx.fillStyle = eyeWhite;
    ctx.fillRect(18, 14, 4, 2);
    ctx.fillRect(25, 14, 4, 2);
    ctx.fillStyle = eyeDark;
    ctx.fillRect(20, 15, 1, 1);
    ctx.fillRect(27, 15, 1, 1);
    ctx.fillRect(18, 12, 4, 1);
    ctx.fillRect(25, 12, 4, 1);
    ctx.fillRect(22, 16, 3, 3);
    ctx.fillRect(21, 19, 6, 1);

    ctx.fillStyle = hoodie;
    ctx.fillRect(12, 31, 24, 5);
    ctx.fillRect(11, 36, 26, 18);
    ctx.fillRect(7, leftArmY, 6, 18);
    ctx.fillRect(35, rightArmY, 6, 17);
    ctx.fillRect(14, 26, 4, 10);
    ctx.fillRect(30, 26, 4, 10);
    ctx.fillRect(18, 28, 12, 6);

    ctx.fillStyle = hoodieShade;
    ctx.fillRect(15, 33, 4, 16);
    ctx.fillRect(29, 33, 4, 16);
    ctx.fillRect(14, 28, 3, 8);
    ctx.fillStyle = hoodieTrim;
    ctx.fillRect(16, 33, 1, 13);
    ctx.fillRect(31, 33, 1, 13);
    ctx.fillRect(20, 34, 1, 4);
    ctx.fillRect(27, 34, 1, 4);

    ctx.fillStyle = shirtPanel;
    ctx.fillRect(18, 37, 12, 14);
    ctx.fillStyle = shirtText;
    ctx.fillRect(19, 37, 10, 2);
    ctx.fillRect(21, 40, 6, 1);
    ctx.fillRect(20, 42, 8, 1);
    ctx.fillStyle = '#f4c85b';
    ctx.fillRect(19, 43, 3, 3);
    ctx.fillStyle = '#d35b61';
    ctx.fillRect(22, 43, 3, 3);
    ctx.fillStyle = '#7bc7f0';
    ctx.fillRect(25, 43, 3, 3);
    ctx.fillStyle = '#f2ede5';
    ctx.fillRect(20, 46, 8, 3);
    ctx.fillRect(19, 49, 10, 1);

    ctx.fillStyle = skin;
    ctx.fillRect(8, leftHandY, 4, 4);
    ctx.fillRect(34, rightHandY, 4, 4);
    ctx.fillRect(29, 45, 4, 7);

    ctx.fillStyle = chain;
    ctx.fillRect(14, 50, 3, 1);
    ctx.fillRect(15, 51, 3, 1);
    ctx.fillRect(16, 52, 3, 1);
    ctx.fillRect(15, 53, 3, 1);
    ctx.fillRect(32, 45, 1, 6);
    ctx.fillRect(12, 54, 5, 3);

    ctx.fillStyle = jeans;
    ctx.fillRect(leftLegX, leftLegY, 8, leftLegHeight);
    ctx.fillRect(rightLegX, rightLegY, 8, rightLegHeight);
    ctx.fillStyle = jeansShade;
    ctx.fillRect(leftLegX + 2, leftLegY, 4, leftLegHeight);
    ctx.fillRect(rightLegX + 2, rightLegY, 4, rightLegHeight);
    ctx.fillStyle = jeansLight;
    ctx.fillRect(leftLegX + 1, leftLegY + 1, 1, leftLegHeight - 2);
    ctx.fillRect(rightLegX + 1, rightLegY + 1, 1, rightLegHeight - 2);
    ctx.fillStyle = jeansWear;
    [
      [leftLegX + 1, 56],
      [leftLegX + 4, 60],
      [leftLegX + 1, 64],
      [rightLegX + 3, 55],
      [rightLegX + 1, 59],
      [rightLegX + 4, 63],
      [rightLegX + 1, 67]
    ].forEach(([x, y]) => {
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
    });
    ctx.fillStyle = hoodieShade;
    ctx.fillRect(19, 49, 3, 3);
    ctx.fillRect(28, 49, 3, 3);

    ctx.fillStyle = shoes;
    ctx.fillRect(leftLegX - 2, leftShoeY, 10, 4);
    ctx.fillRect(rightLegX - 2, rightShoeY, 10, 4);
    ctx.fillStyle = shoesShade;
    ctx.fillRect(leftLegX - 1, leftShoeY + 2, 8, 1);
    ctx.fillRect(rightLegX - 1, rightShoeY + 2, 8, 1);
    ctx.fillRect(leftLegX, leftShoeY + 1, 6, 1);
    ctx.fillRect(rightLegX, rightShoeY + 1, 6, 1);
    ctx.fillStyle = sole;
    ctx.fillRect(leftLegX - 1, leftShoeY + 4, 8, 1);
    ctx.fillRect(rightLegX - 1, rightShoeY + 4, 8, 1);
  });
}

export class Player {
  public mesh: THREE.Group;
  public head: THREE.Object3D;
  private readonly world: RAPIER.World;
  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private readonly spriteRig: THREE.Group;
  private readonly spriteMaterials: THREE.MeshBasicMaterial[];
  private readonly shadow: THREE.Mesh;
  private readonly baseSpriteScale = new THREE.Vector3(3.2, 4.8, 1);
  private readonly frameTextures = {
    front: {
      idle: createPlayerTexture('front', 'idle'),
      stepLeft: createPlayerTexture('front', 'step-left'),
      stepRight: createPlayerTexture('front', 'step-right')
    },
    back: {
      idle: createPlayerTexture('back', 'idle'),
      stepLeft: createPlayerTexture('back', 'step-left'),
      stepRight: createPlayerTexture('back', 'step-right')
    },
    side: {
      idle: createPlayerTexture('side', 'idle'),
      stepLeft: createPlayerTexture('side', 'step-left'),
      stepRight: createPlayerTexture('side', 'step-right')
    }
  };
  private direction = new THREE.Vector3();
  private keys: Record<string, boolean> = {};
  private bobTime = 0;
  private isMoving = false;
  private speedMultiplier = 1;
  private ridingSkateboard = false;
  private clickMoveTarget: THREE.Vector3 | null = null;
  private blockedFrames = 0;
  private activeView: PlayerView = 'front';
  private bodyYaw = FRONT_VIEW_YAW;
  private targetBodyYaw = FRONT_VIEW_YAW;
  private activeViewYaw = FRONT_VIEW_YAW;
  private sideMirror: 1 | -1 = 1;

  constructor(world: RAPIER.World, spawn?: THREE.Vector3) {
    this.world = world;
    this.mesh = new THREE.Group();
    this.head = new THREE.Object3D();
    this.head.position.y = 0.92;
    this.mesh.add(this.head);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x2d2319, transparent: true, opacity: 0.26 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.rotation.z = 0.55;
    this.shadow.position.set(-0.08, -1.12, 0.08);
    this.mesh.add(this.shadow);

    const planeGeometry = new THREE.PlaneGeometry(this.baseSpriteScale.x, this.baseSpriteScale.y);
    planeGeometry.translate(0, this.baseSpriteScale.y / 2, 0);
    const shellGeometry = new THREE.PlaneGeometry(
      this.baseSpriteScale.x * 1.08,
      this.baseSpriteScale.y * 1.05
    );
    shellGeometry.translate(0, (this.baseSpriteScale.y * 1.05) / 2, 0);
    this.spriteMaterials = [];
    this.spriteRig = new THREE.Group();
    this.spriteRig.position.set(0, -1.12, 0);
    const cardDepths = [-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18];
    const maxCardDepth = Math.max(...cardDepths.map(depth => Math.abs(depth)));
    const cardStack = new THREE.Group();

    const shellMaterial = new THREE.MeshBasicMaterial({
      map: this.frameTextures.front.idle,
      color: 0x20242a,
      transparent: true,
      alphaTest: 0.12,
      opacity: 0.84,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const shellPlane = new THREE.Mesh(shellGeometry, shellMaterial);
    shellPlane.position.z = -0.28;
    shellPlane.position.y = -0.03;
    shellPlane.renderOrder = 20;
    cardStack.add(shellPlane);
    this.spriteMaterials.push(shellMaterial);

    cardDepths.forEach((depth, index) => {
      const normalizedDepth = Math.abs(depth) / maxCardDepth;
      const depthTint = index === Math.floor(cardDepths.length / 2) ? 0xffffff : 0xe0e7f0;
      const material = new THREE.MeshBasicMaterial({
        map: this.frameTextures.front.idle,
        color: depthTint,
        transparent: true,
        alphaTest: 0.12,
        opacity: 1 - normalizedDepth * 0.08,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry.clone(), material);
      plane.position.z = depth;
      const thicknessScale = 1 + normalizedDepth * 0.028;
      plane.scale.set(thicknessScale, 1 + normalizedDepth * 0.018, 1);
      plane.position.y = -normalizedDepth * 0.018;
      plane.renderOrder = 22 + index;
      cardStack.add(plane);
      this.spriteMaterials.push(material);
    });

    this.spriteRig.add(cardStack);

    this.mesh.add(this.spriteRig);
    this.shadow.renderOrder = 18;

    const start = spawn ?? new THREE.Vector3(0, 1, 0);
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, start.y, start.z);
    this.body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.24).setActiveCollisionTypes(
      RAPIER.ActiveCollisionTypes.ALL
    );
    this.collider = world.createCollider(colliderDesc, this.body);
    this.controller = world.createCharacterController(0.08);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.setSlideEnabled(true);
    this.controller.enableAutostep(0.55, 0.4, false);

    window.addEventListener('keydown', e => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', e => (this.keys[e.key.toLowerCase()] = false));
  }

  setPosition(pos: THREE.Vector3) {
    this.body.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    this.body.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
    this.mesh.position.copy(pos);
  }

  setClickMoveTarget(target: THREE.Vector3 | null) {
    this.clickMoveTarget = target ? target.clone() : null;
  }

  setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  setRidingSkateboard(riding: boolean) {
    this.ridingSkateboard = riding;
  }

  halt() {
    this.direction.set(0, 0, 0);
    this.isMoving = false;
    this.blockedFrames = 0;
    const current = this.body.translation();
    this.body.setNextKinematicTranslation({ x: current.x, y: current.y, z: current.z });
  }

  private isPressed(...keys: string[]) {
    return keys.some(key => this.keys[key]);
  }

  getFacingYaw() {
    return this.bodyYaw;
  }

  private updateSpriteView(cameraQuaternion?: THREE.Quaternion) {
    if (!cameraQuaternion) {
      return;
    }

    const playerToCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraQuaternion);
    playerToCamera.y = 0;
    if (playerToCamera.lengthSq() < 0.0001) {
      return;
    }

    playerToCamera.normalize();
    const yaw = Math.atan2(playerToCamera.x, playerToCamera.z);
    const relativeYaw = wrapAngle(yaw - this.bodyYaw);
    const absRelativeYaw = Math.abs(relativeYaw);

    if (absRelativeYaw <= Math.PI / 4) {
      this.activeView = 'front';
      this.activeViewYaw = this.bodyYaw;
      this.sideMirror = 1;
      return;
    }

    if (absRelativeYaw >= (Math.PI * 3) / 4) {
      this.activeView = 'back';
      this.activeViewYaw = this.bodyYaw + Math.PI;
      this.sideMirror = 1;
      return;
    }

    this.activeView = 'side';
    this.activeViewYaw = this.bodyYaw + (relativeYaw > 0 ? Math.PI / 2 : -Math.PI / 2);
    this.sideMirror = relativeYaw > 0 ? -1 : 1;
  }

  update(cameraQuaternion?: THREE.Quaternion) {
    this.updateSpriteView(cameraQuaternion);
    this.direction.set(0, 0, 0);
    const current = this.body.translation();
    const hasManualInput =
      this.isPressed('arrowup', 'w') ||
      this.isPressed('arrowdown', 's') ||
      this.isPressed('arrowleft', 'a') ||
      this.isPressed('arrowright', 'd');

    if (hasManualInput && cameraQuaternion) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);

      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      if (this.isPressed('arrowup', 'w')) this.direction.add(forward);
      if (this.isPressed('arrowdown', 's')) this.direction.sub(forward);
      if (this.isPressed('arrowleft', 'a')) this.direction.sub(right);
      if (this.isPressed('arrowright', 'd')) this.direction.add(right);
    } else if (hasManualInput) {
      if (this.isPressed('arrowup', 'w')) this.direction.z -= 1;
      if (this.isPressed('arrowdown', 's')) this.direction.z += 1;
      if (this.isPressed('arrowleft', 'a')) this.direction.x -= 1;
      if (this.isPressed('arrowright', 'd')) this.direction.x += 1;
    } else if (this.clickMoveTarget) {
      this.direction.set(
        this.clickMoveTarget.x - current.x,
        0,
        this.clickMoveTarget.z - current.z
      );
      if (this.direction.lengthSq() < 0.2) {
        this.clickMoveTarget = null;
        this.direction.set(0, 0, 0);
      }
    }

    if (hasManualInput) {
      this.clickMoveTarget = null;
    }

    this.direction.normalize();
    const desiredStep = this.direction.clone().multiplyScalar(
      SPEED * this.speedMultiplier * this.world.timestep
    );

    this.controller.computeColliderMovement(this.collider, desiredStep, undefined, undefined, candidate => {
      if (candidate.handle === this.collider.handle) {
        return false;
      }

      const parentTag = candidate.parent()?.userData;
      return parentTag !== 'ground' && parentTag !== 'npc';
    });

    const correctedStep = this.controller.computedMovement();
    const correctedMovement = new THREE.Vector3(correctedStep.x, 0, correctedStep.z);
    const nextPosition = {
      x: current.x + correctedMovement.x,
      y: current.y,
      z: current.z + correctedMovement.z
    };
    this.body.setNextKinematicTranslation(nextPosition);

    this.isMoving = correctedMovement.lengthSq() > 0.00001;
    if (this.isMoving) {
      this.targetBodyYaw = Math.atan2(correctedMovement.x, correctedMovement.z);
    }
    this.bodyYaw = wrapAngle(this.bodyYaw + wrapAngle(this.targetBodyYaw - this.bodyYaw) * 0.22);

    if (this.clickMoveTarget && this.direction.lengthSq() > 0) {
      if (this.isMoving) {
        this.blockedFrames = 0;
      } else {
        this.blockedFrames += 1;
        if (this.blockedFrames > 8) {
          this.clickMoveTarget = null;
          this.blockedFrames = 0;
        }
      }
    } else {
      this.blockedFrames = 0;
    }
  }

  syncVisual() {
    const t = this.body.translation();
    this.mesh.position.set(t.x, t.y, t.z);

    if (this.isMoving) {
      this.bobTime += 0.28;
    } else {
      this.bobTime += 0.08;
    }

    const bobStrength = this.ridingSkateboard ? (this.isMoving ? 0.025 : 0.008) : this.isMoving ? 0.06 : 0.02;
    const rideLift = this.ridingSkateboard ? 0.08 : 0;
    const bob = Math.sin(this.bobTime) * bobStrength;
    const walkSway = this.isMoving ? Math.sin(this.bobTime * 0.5) * 0.03 : 0;
    const stridePhase = Math.sin(this.bobTime);
    const hipShift = this.isMoving ? stridePhase * 0.05 : 0;
    const walkTurn = this.isMoving ? stridePhase * 0.016 : 0;
    this.head.position.y = 0.92 + rideLift + bob * 0.35;
    this.head.position.x = -hipShift * 0.18;
    this.spriteRig.position.set(hipShift, -1.12 + rideLift + bob, walkSway);
    this.spriteRig.rotation.y = this.activeViewYaw + walkTurn;
    this.spriteRig.scale.set(
      this.activeView === 'side' ? this.sideMirror : 1,
      1 + (this.ridingSkateboard ? 0.02 : 0),
      1
    );
    this.shadow.scale.set(1 - Math.abs(bob) * 0.6, 1, 1 - Math.abs(bob) * 0.45);
    this.shadow.rotation.z = 0.55;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = this.ridingSkateboard ? 0.18 : 0.26;

    const activeFrames = this.frameTextures[this.activeView];
    let frame = activeFrames.idle;
    if (this.isMoving) {
      frame = Math.sin(this.bobTime) > 0 ? activeFrames.stepLeft : activeFrames.stepRight;
    }

    this.spriteMaterials.forEach(material => {
      if (material.map !== frame) {
        material.map = frame;
        material.needsUpdate = true;
      }
    });
  }
}
