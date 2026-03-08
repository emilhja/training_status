import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'react-is',
      'recharts',
      '@reduxjs/toolkit',
      'clsx',
      'decimal.js-light',
      'es-toolkit',
      'eventemitter3',
      'immer',
      'react-redux',
      'reselect',
      'tiny-invariant',
      'use-sync-external-store',
    ],
    noDiscovery: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})
