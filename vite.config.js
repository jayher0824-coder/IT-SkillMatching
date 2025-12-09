import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'client/public/dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'chart': ['chart.js', 'react-chartjs-2']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})

