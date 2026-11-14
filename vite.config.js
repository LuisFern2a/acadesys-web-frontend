import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto fijo: el backend solo admite por CORS los puertos 5173 y 5174.
    port: 5174,
    strictPort: true,
  },
})
