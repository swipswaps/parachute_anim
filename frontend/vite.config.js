import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path' // Uncomment when implementing path aliases

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/token': 'http://localhost:8000',
      '/launch': 'http://localhost:8000',
      '/exports': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})

/**
 * PROPOSED ENHANCEMENTS (Not Yet Implemented)
 *
 * 1. Add path aliases for easier imports:
 *
 * resolve: {
 *   alias: {
 *     '@': path.resolve(__dirname, './src'),
 *   },
 * },
 *
 * 2. Enhanced proxy configuration with additional options:
 *
 * server: {
 *   proxy: {
 *     '/api': {
 *       target: 'http://localhost:8000',
 *       changeOrigin: true,
 *       secure: false,
 *     },
 *     '/token': {
 *       target: 'http://localhost:8000',
 *       changeOrigin: true,
 *       secure: false,
 *     },
 *     '/launch': {
 *       target: 'http://localhost:8000',
 *       changeOrigin: true,
 *       secure: false,
 *     },
 *   },
 * }
 *
 * See PROPOSED_ENHANCEMENTS.md for more details.
 */
