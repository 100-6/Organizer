import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(env.FRONTEND_PORT),
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: `http://back-end:${env.BACKEND_PORT}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.FRONTEND_PORT),
    }
  }
})