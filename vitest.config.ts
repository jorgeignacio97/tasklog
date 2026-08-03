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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/index.ts',
        'src/main.tsx',
        'src/routeTree.gen.ts',
        'src/routes/**',
        'src/vite-env.d.ts',
        'src/shared/utils/testDb.ts',
        'src/shared/utils/testUtils.tsx',
        'src/shared/hooks/pwaRegisterReact.mock.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 80,
        lines: 88,
      },
    },
  },
})
