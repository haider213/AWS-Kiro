import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries for better caching
          vendor: ['react', 'react-dom'],
          d3: ['d3'],
          visualization: ['tsne-js'],
          state: ['zustand']
        },
        // Optimize asset naming for CDN caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // Enable code splitting for better performance
    chunkSizeWarningLimit: 1000,
    // Asset optimization
    assetsInlineLimit: 4096,
  },
  // PWA and performance optimizations
  define: {
    // Enable service worker in production
    __SW_ENABLED__: JSON.stringify(process.env.NODE_ENV === 'production'),
    // Environment variables for deployment
    __BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:3001'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'd3', 'zustand', 'tsne-js']
  },
  // Preview server configuration for testing production builds
  preview: {
    port: 4173,
    host: true,
  }
})