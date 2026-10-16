import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(process.cwd(), 'src/script/index.ts'),
      fileName: () => 'script.js',
      formats: ['iife'],
      name: 'AbTesterScript',
    },
    minify: false,
    outDir: 'build',
  },
});
