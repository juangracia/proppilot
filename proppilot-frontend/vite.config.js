import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* global process */
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Required for Capacitor native apps
  server: {
    port: Number(process.env.FRONTEND_PORT) || 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || 8080}`,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
