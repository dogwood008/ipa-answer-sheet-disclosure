import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

function copyNotoTtfPlugin(): Plugin {
  const filename = 'NotoSansJP-Regular.ttf'
  return {
    name: 'copy-noto-ttf',
    apply: 'build',
    generateBundle() {
      const fontPath = path.resolve(__dirname, filename)
      if (fs.existsSync(fontPath)) {
        const buf = fs.readFileSync(fontPath)
        this.emitFile({ type: 'asset', fileName: filename, source: buf })
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === `/${filename}`) {
          try {
            const p = path.resolve(__dirname, filename)
            res.setHeader('Content-Type', 'font/ttf')
            fs.createReadStream(p).pipe(res)
            return
          } catch {}
        }
        next()
      })
    },
  }
}

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), copyNotoTtfPlugin()],
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
