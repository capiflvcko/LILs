import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat']
  },
  build: {
    outDir: 'dist/client'
  }
});
