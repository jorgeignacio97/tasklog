import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    forbidOnly: true,
    env: {
      TZ: 'America/Argentina/Buenos_Aires',
    },
  },
})
