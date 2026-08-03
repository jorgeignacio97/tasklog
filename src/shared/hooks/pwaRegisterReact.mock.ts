// Test-only stand-in for the `virtual:pwa-register/react` module, which only
// resolves via the VitePWA vite plugin (not loaded in vitest.config.ts).
// Aliased in vitest.config.ts so usePwaUpdate.test.ts can `vi.mock` it.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  }
}
