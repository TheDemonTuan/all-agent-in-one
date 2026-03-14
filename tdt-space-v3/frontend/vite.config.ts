import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wails from '@wailsio/runtime/plugins/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Wails-compatible Vite config
// - Port is set by Wails via WAILS_VITE_PORT env var (from Taskfile VITE_PORT)
// - Output goes to dist/ (relative to this frontend/ dir)
// - Optimized for memory and bundle size
const VITE_PORT = parseInt(process.env.WAILS_VITE_PORT || '9245', 10);
const isDev = process.env.PRODUCTION !== 'true';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true, // Enable Svelte 5 runes mode
      }
    }),
    wails('./bindings'),
    // Bundle size visualization (development only)
    !isDev && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: VITE_PORT,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    cssTarget: 'esnext',
    // Use LightningCSS for faster CSS processing (already installed)
    cssMinify: 'lightningcss',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        // Additional optimizations
        pure_getters: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
      },
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          'svelte-vendor': ['svelte'],
          'xterm': ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links', '@xterm/addon-search', '@xterm/addon-webgl'],
        },
        // Optimize chunk naming
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1200,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['@xterm/xterm'],
    // Exclude large dependencies that don't need pre-bundling
    exclude: ['@xterm/addon-webgl'],
  },
  // Clear screen for better dev experience
  clearScreen: true,
});
