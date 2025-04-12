import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util'],
      globals: { Buffer: true, process: true }
    })
  ],
  define: {
    global: 'window',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  }
})