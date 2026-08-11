import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind mounts de Docker en Windows no siempre propagan eventos de
    // cambio de archivo al contenedor Linux -- Vite se queda sirviendo
    // versiones viejas sin darse cuenta. Polling fuerza a chequear
    // activamente en vez de esperar ese aviso que a veces no llega.
    watch: {
      usePolling: true,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
