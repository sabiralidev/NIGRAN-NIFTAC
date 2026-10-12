import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // System inotify watch budget is exhausted by other watchers (VS Code, other
    // dev servers), so native file watching fails with ENOSPC and crash-loops the
    // dev server. Poll instead: zero inotify watches, HMR still works.
    watch: { usePolling: true, interval: 800 },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
