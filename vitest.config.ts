import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Only resolvable via the VitePWA vite plugin, which isn't loaded
      // here — see src/shared/hooks/pwaRegisterReact.mock.ts.
      'virtual:pwa-register/react':
        '/src/shared/hooks/pwaRegisterReact.mock.ts',
    },
  },
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
