import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/coffeecraft/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/coffeecraft/api': {
        target: 'http://127.0.0.1:3001',
        rewrite: path => path.replace(/^\/coffeecraft\/api/, '/api'),
      },
    },
  },
})
