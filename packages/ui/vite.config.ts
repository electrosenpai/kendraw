import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // draft-js (transitive dep of ketcher-react) references the Node `global`.
    global: 'globalThis',
  },
  optimizeDeps: {
    // ketcher-core/index.modern.js has `require('raphael')` gated by
    // typeof window, which Rollup leaves untouched unless we pre-bundle
    // through esbuild. Listing the ketcher packages (+ raphael) here forces
    // esbuild to rewrite CJS→ESM during dev and, in tandem with
    // commonjsOptions.transformMixedEsModules below, keeps the prod bundle
    // free of raw require() calls.
    include: [
      'ketcher-react',
      'ketcher-core',
      'ketcher-standalone',
      'raphael',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      // ketcher-core ships ESM files that still contain runtime `require()`
      // calls for browser-only CJS deps (raphael). Without this flag,
      // @rollup/plugin-commonjs skips the file because it's detected as ESM,
      // and the require survives into the production bundle — triggering
      // "ReferenceError: require is not defined" at load time.
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
