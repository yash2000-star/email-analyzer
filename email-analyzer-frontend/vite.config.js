// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Add this 'server' configuration
    proxy: {
      // String shorthand: '/api' -> 'http://localhost:3001/api'
      // We also need to proxy '/auth' for login/logout
      '/api': { // Proxy requests starting with /api
        target: 'http://localhost:3001', // Your backend server
        changeOrigin: true, // Needed for virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api/, '') // Optional: if you want to remove /api prefix when sending to backend
      },
      '/auth': { // Proxy requests starting with /auth
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})