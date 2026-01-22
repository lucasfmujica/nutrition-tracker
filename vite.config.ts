import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/oura': {
        target: 'https://api.ouraring.com/v2/usercollection',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/oura/, ''),
        secure: true,
      },
    },
  },
})
