import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
    server: {
    host: '10.90.25.125',
    port: 3002,
    proxy: {
      "/api": {
        target: "http://10.90.25.125:5000",
        changeOrigin: true,
      },
    },
  },
    resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
