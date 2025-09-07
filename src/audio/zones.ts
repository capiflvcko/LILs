import * as THREE from 'three';

export function createAudioZone(listener: THREE.AudioListener, position: THREE.Vector3, buffer: AudioBuffer) {
  const audio = new THREE.PositionalAudio(listener);
  audio.position.copy(position);
  audio.setBuffer(buffer);
  audio.setRefDistance(5);
  return audio;
}
