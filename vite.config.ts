import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        // Before (Incorrect): Looking in the root directory
        // background: 'background.ts'

        // After (Correct): Pointing to the file inside the src/ directory
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: assetInfo => {
          return assetInfo.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});