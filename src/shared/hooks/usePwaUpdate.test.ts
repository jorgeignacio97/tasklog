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

  useRegisterSWMock.mockReturnValue({
    needRefresh: [overrides.needRefresh ?? false, vi.fn()],
    offlineReady: [overrides.offlineReady ?? false, setOfflineReady],
    updateServiceWorker,
  })

  return { setOfflineReady, updateServiceWorker }
}

describe('usePwaUpdate (PWA-1..3)', () => {
  afterEach(() => {
    vi.resetAllMocks()
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
})
