import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '');
        return path.resolve(__dirname, 'assets', filename);
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), figmaAssetResolver()],
  publicDir: 'public',
  resolve: {
    alias: [
      {
        find: /(.+)@[\d]+\.[\d]+\.[\d]+(?:[-\w.]*)?$/,
        replacement: '$1',
      },
      {
        find: '@/',
        replacement: `${path.resolve(__dirname, './')}/`,
      },
    ],
  },
  build: {
    outDir: 'dist',
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
