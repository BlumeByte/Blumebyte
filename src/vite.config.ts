import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      // Exclude supabase functions from the build
      external: [
        /^node:/,
      ],
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  // Exclude supabase directory from processing
  optimizeDeps: {
    exclude: ['supabase'],
  },
});
