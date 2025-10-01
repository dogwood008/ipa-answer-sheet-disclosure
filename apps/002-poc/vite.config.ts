import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 5173),
    fs: {
      // allow importing from repo root (outside app root)
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
