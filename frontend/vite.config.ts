import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const apiTarget = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 0.0.0.0: aceita celular na LAN (Wi‑Fi ou cabo/Ethernet no mesmo roteador)
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      host: '0.0.0.0',
      port: 5173,
    },
    proxy: {
      '/auth': { target: apiTarget, changeOrigin: true },
      '/equipment': { target: apiTarget, changeOrigin: true },
      '/loans': { target: apiTarget, changeOrigin: true },
      '/notifications': { target: apiTarget, changeOrigin: true },
      '/health': { target: apiTarget, changeOrigin: true },
    },
  },
})
