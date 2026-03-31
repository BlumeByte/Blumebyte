import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function stripVersionSpecifiers() {
  return {
    name: 'strip-version-specifiers',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!/\.[cm]?[jt]sx?$/.test(id) || !code.includes('@')) {
        return null;
      }
      const transformed = code.replace(
        /((?:from\s+['"])|(?:import\s*\(\s*['"]))([^'"]+?)@\d+\.\d+\.\d+([^'"]*?)(['"]\s*\)?)/g,
        '$1$2$3$4',
      );
      return transformed === code ? null : transformed;
    },
  };
}

export default defineConfig({
  plugins: [stripVersionSpecifiers(), react(), tailwindcss()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
