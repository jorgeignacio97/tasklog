import { renderHookWithProviders } from '../utils/testUtils'
import { usePwaUpdate } from './usePwaUpdate'

const sonnerToast = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    success: ReturnType<typeof vi.fn>
  }
  fn.success = vi.fn()
  return fn
})

vi.mock('sonner', () => ({ toast: sonnerToast }))

const useRegisterSWMock = vi.hoisted(() => vi.fn())

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: useRegisterSWMock,
}))

let registeredCallback: ((...args: unknown[]) => void) | undefined

function mockRegisterSW(
  overrides: Partial<{
    needRefresh: boolean
    offlineReady: boolean
    setOfflineReady: ReturnType<typeof vi.fn>
    updateServiceWorker: ReturnType<typeof vi.fn>
  }> = {},
) {
  const setOfflineReady = overrides.setOfflineReady ?? vi.fn()
  const updateServiceWorker = overrides.updateServiceWorker ?? vi.fn()

  useRegisterSWMock.mockImplementation(
    (options?: { onRegisteredSW?: (...args: unknown[]) => void }) => {
      registeredCallback = options?.onRegisteredSW
      return {
        needRefresh: [overrides.needRefresh ?? false, vi.fn()],
        offlineReady: [overrides.offlineReady ?? false, setOfflineReady],
        updateServiceWorker,
      }
    },
  )

  return { setOfflineReady, updateServiceWorker }
}

describe('usePwaUpdate (PWA-1..3)', () => {
  afterEach(() => {
    vi.resetAllMocks()
    registeredCallback = undefined
    vi.useRealTimers()
  })

  it('PWA-1: neither toast fires when there is nothing to report', () => {
    mockRegisterSW()

    renderHookWithProviders(() => usePwaUpdate())

    expect(sonnerToast).not.toHaveBeenCalled()
    expect(sonnerToast.success).not.toHaveBeenCalled()
  })

  it('PWA-2: needRefresh shows an update toast whose action triggers the SW update', () => {
    const { updateServiceWorker } = mockRegisterSW({ needRefresh: true })

    renderHookWithProviders(() => usePwaUpdate())

    expect(sonnerToast).toHaveBeenCalledTimes(1)
    const [message, options] = sonnerToast.mock.calls[0] as [
      string,
      { action: { label: string; onClick: () => void } },
    ]
    expect(message).toBe('Nueva versión disponible')
    expect(options.action.label).toBe('Actualizar')

    options.action.onClick()
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('PWA-3: offlineReady shows a success toast once and clears the flag', () => {
    const { setOfflineReady } = mockRegisterSW({ offlineReady: true })

    renderHookWithProviders(() => usePwaUpdate())

    expect(sonnerToast.success).toHaveBeenCalledTimes(1)
    expect(sonnerToast.success).toHaveBeenCalledWith(
      'TaskLog está listo para funcionar sin conexión',
    )
    expect(setOfflineReady).toHaveBeenCalledWith(false)
  })

  it('PWA-4: registers a periodic update check that calls registration.update() every hour', () => {
    vi.useFakeTimers()
    mockRegisterSW()
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServiceWorkerRegistration

    renderHookWithProviders(() => usePwaUpdate())
    registeredCallback?.('sw.js', registration)

    expect(registration.update).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(registration.update).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(registration.update).toHaveBeenCalledTimes(2)
  })

  it('PWA-4 Edge: a rejected registration.update() is caught and logged, not an unhandled rejection', async () => {
    vi.useFakeTimers()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockRegisterSW()
    const registration = {
      update: vi.fn().mockRejectedValue(new Error('network down')),
    } as unknown as ServiceWorkerRegistration

    renderHookWithProviders(() => usePwaUpdate())
    registeredCallback?.('sw.js', registration)

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'No se pudo comprobar si hay una nueva versión',
      expect.any(Error),
    )
    consoleErrorSpy.mockRestore()
  })

  it('PWA-4 Edge: no registration passed to onRegisteredSW never schedules a check', () => {
    vi.useFakeTimers()
    mockRegisterSW()

    renderHookWithProviders(() => usePwaUpdate())
    registeredCallback?.('sw.js', undefined)

    // Nothing to assert on directly other than: no timer fires and no throw.
    expect(() => vi.advanceTimersByTime(60 * 60 * 1000)).not.toThrow()
  })
})
