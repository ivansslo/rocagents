import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'react-is': path.resolve(__dirname, 'node_modules/react-is/index.js'),
    },
    dedupe: ['react', 'react-dom', 'react-is', 'recharts'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-is', 'recharts', 'react/jsx-runtime'],
    esbuildOptions: {
      mainFields: ['browser', 'module', 'main'],
    },
  },
  ssr: {
    noExternal: ['recharts', 'react-is'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
});
