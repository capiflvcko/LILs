import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export function createTrimesh(mesh: THREE.Mesh) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const vertices = geometry.getAttribute('position').array as Float32Array;
  const indices = geometry.getIndex()
    ? (geometry.getIndex()!.array as Uint32Array)
    : new Uint32Array();
  return RAPIER.ColliderDesc.trimesh(vertices, indices);
}
