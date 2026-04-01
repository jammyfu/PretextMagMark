import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 4173,
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },
})
