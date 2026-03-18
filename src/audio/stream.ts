import * as THREE from 'three';
import { requestSong } from './generative';

export async function playAIGeneratedSong(songId: string, position: THREE.Vector3) {
  const buffer = await requestSong(songId);
  const audioCtx = new AudioContext();
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  const panner = audioCtx.createPanner();
  panner.positionX.value = position.x;
  panner.positionY.value = position.y;
  panner.positionZ.value = position.z;

  source.connect(panner).connect(audioCtx.destination);
  source.start();
}
