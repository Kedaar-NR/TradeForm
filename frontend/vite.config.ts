import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Add this define block to make REACT_APP_ variables available
  define: {
    'import.meta.env.REACT_APP_API_URL': JSON.stringify(
      process.env.REACT_APP_API_URL || ''
    ),
    'import.meta.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(
      process.env.REACT_APP_GEMINI_API_KEY || ''
    ),
  },
});

