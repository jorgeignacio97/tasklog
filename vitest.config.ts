import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    allowOnly: false,
    env: {
      TZ: 'America/Argentina/Buenos_Aires',
    },
  },
})
