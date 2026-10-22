import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El backend solo autoriza por CORS los orígenes de desarrollo
    // http://localhost:5173 y http://localhost:5174 (ver config/cors.js del API).
    // Si Vite se desplaza en silencio a 5175 o superior (puerto ocupado),
    // TODAS las peticiones al API fallan por CORS y la aplicación aparece vacía.
    // Por eso el puerto se fija aquí y no se permite el desplazamiento automático.
    port: 5174,
    strictPort: true,
  },
})
