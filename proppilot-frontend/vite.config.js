import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Slot 0 is 3000 -> 8080. Parallel worktrees (scripts/wt.sh) set FRONTEND_PORT and BACKEND_PORT.
const frontendPort = Number(process.env.FRONTEND_PORT) || 3000
const backendPort = Number(process.env.BACKEND_PORT) || 8080

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Required for Capacitor native apps
  server: {
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
