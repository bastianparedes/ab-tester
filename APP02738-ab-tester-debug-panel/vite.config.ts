import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/entry.tsx',
      fileName: () => 'script.js',
      formats: ['iife'],
      name: 'ABTesterDebugTool',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-package-json',
      writeBundle() {
        const src = path.resolve(__dirname, 'package.json');
        const dest = path.resolve(__dirname, 'dist', 'package.json');
        fs.copyFileSync(src, dest);
      },
    },
  ],
});
