import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../shared/utils/testUtils'
import { useReminder } from './useReminder'

const REMINDER_INACTIVE_KEY = 'tasklog_reminder_inactive'
const REMINDER_UNREPORTED_KEY = 'tasklog_reminder_unreported'

// Fixed clock: 2026-09-30 12:00 local (near month end, but NOT the real
// current date — the real date must never satisfy the assertions, otherwise
// a non-injected implementation could pass RM-1 vacuously).
const fixedNow = () => new Date(2026, 8, 30, 12)

class FakeNotification {
  static permission: NotificationPermission = 'granted'
  static requestPermission = vi.fn(
    async (): Promise<NotificationPermission> => 'granted',
  )
  static instances: FakeNotification[] = []

  title: string
  options?: NotificationOptions

  constructor(title: string, options?: NotificationOptions) {
    this.title = title
    this.options = options
    FakeNotification.instances.push(this)
  }

  static reset(): void {
    FakeNotification.permission = 'granted'
    FakeNotification.instances = []
    FakeNotification.requestPermission = vi.fn(
      async (): Promise<NotificationPermission> => 'granted',
    )
  }

  close(): void {}
}

const taskServiceMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByCategory: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUnreportedInRange: vi.fn(),
}))

vi.mock('../../../lib/services', () => ({
  taskService: taskServiceMock,
}))

function task(createdAt: string) {
  return {
    id: 't-1',
    title: 'Task',
    category: 'frontend' as const,
    status: 'pendiente' as const,
    estimatedDuration: 1,
    notes: [],
    createdAt,
    updatedAt: createdAt,
  }
}

describe('useReminder (RM-1..5)', () => {
  beforeEach(() => {
    localStorage.clear()
    FakeNotification.reset()
    vi.stubGlobal('Notification', FakeNotification)
    // Safe defaults: unconfigured service calls resolve empty so the effect
    // takes the "nothing to notify" path unless a test overrides them.
    taskServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.getUnreportedInRange.mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('RM-1 Happy: all 4 clock sites use the injected clock — no real dates', async () => {
    taskServiceMock.getAll.mockResolvedValue([
      task('2026-09-27T12:00:00.000Z'),
    ])
    taskServiceMock.getUnreportedInRange.mockResolvedValue([
      task('2026-09-20T12:00:00.000Z'),
      task('2026-09-25T12:00:00.000Z'),
    ])

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(FakeNotification.instances).toHaveLength(2),
    )

    // Effect-body site: monthStart/monthEnd derived from the injected clock
    expect(taskServiceMock.getUnreportedInRange).toHaveBeenCalledWith(
      '2026-09-01',
      '2026-09-30',
    )
    // today() site: both day keys use the injected date
    expect(localStorage.getItem(REMINDER_INACTIVE_KEY)).toBe('2026-09-30')
    expect(localStorage.getItem(REMINDER_UNREPORTED_KEY)).toBe('2026-09-30')
  })

  it('RM-2 Edge: no-ops when Notification is unsupported', async () => {
    vi.stubGlobal('Notification', undefined)
    delete (window as unknown as Record<string, unknown>).Notification

    renderHookWithProviders(() => useReminder(fixedNow))

    expect(taskServiceMock.getAll).not.toHaveBeenCalled()
    expect(taskServiceMock.getUnreportedInRange).not.toHaveBeenCalled()
  })

  it('RM-2 Edge: permission default → requestPermission once, no notifications', async () => {
    FakeNotification.permission = 'default'

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(1),
    )
    expect(FakeNotification.instances).toHaveLength(0)
    expect(taskServiceMock.getAll).not.toHaveBeenCalled()
  })

  it('RM-2 Edge: permission denied → nothing fires', async () => {
    FakeNotification.permission = 'denied'

    renderHookWithProviders(() => useReminder(fixedNow))

    expect(FakeNotification.requestPermission).not.toHaveBeenCalled()
    expect(FakeNotification.instances).toHaveLength(0)
    expect(taskServiceMock.getAll).not.toHaveBeenCalled()
    expect(taskServiceMock.getUnreportedInRange).not.toHaveBeenCalled()
  })

  it('RM-3 Happy: newest task 3 days old → inactivity notification, key set to today', async () => {
    taskServiceMock.getAll.mockResolvedValue([
      task('2026-09-25T12:00:00.000Z'),
      task('2026-09-27T12:00:00.000Z'),
    ])

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(FakeNotification.instances).toHaveLength(1),
    )
    expect(FakeNotification.instances[0].title).toBe(
      'TaskLog — Inactividad',
    )
    expect(FakeNotification.instances[0].options?.body).toBe(
      'Hace 3 días que no registras tareas. ¡Registra algo nuevo!',
    )
    expect(localStorage.getItem(REMINDER_INACTIVE_KEY)).toBe('2026-09-30')
  })

  it('RM-3 Edge: zero tasks → no notification, key untouched', async () => {
    taskServiceMock.getAll.mockResolvedValue([])

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )
    expect(FakeNotification.instances).toHaveLength(0)
    expect(localStorage.getItem(REMINDER_INACTIVE_KEY)).toBeNull()
  })

  it('RM-3 Edge: newest task younger than 3 days → no notification, key untouched', async () => {
    taskServiceMock.getAll.mockResolvedValue([
      task('2026-09-28T12:00:00.000Z'),
    ])

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )
    expect(FakeNotification.instances).toHaveLength(0)
    expect(localStorage.getItem(REMINDER_INACTIVE_KEY)).toBeNull()
  })

  it('RM-4 Happy: near month end + unreported tasks → month-end notification, key set', async () => {
    taskServiceMock.getAll.mockResolvedValue([
      task('2026-09-27T12:00:00.000Z'),
    ])
    taskServiceMock.getUnreportedInRange.mockResolvedValue([
      task('2026-09-10T12:00:00.000Z'),
      task('2026-09-15T12:00:00.000Z'),
    ])

    renderHookWithProviders(() => useReminder(fixedNow))

    await waitFor(() =>
      expect(FakeNotification.instances).toHaveLength(2),
    )
    const monthEnd = FakeNotification.instances.find(
      (n) => n.title === 'TaskLog — Tareas sin reportar',
    )
    expect(monthEnd?.options?.body).toBe(
      'Tienes 2 tareas sin reportar cerca de fin de mes. ¡Crea tu reporte!',
    )
    expect(localStorage.getItem(REMINDER_UNREPORTED_KEY)).toBe('2026-09-30')
  })

  it('RM-5 Edge: key already set for today → that reminder does not fire', async () => {
    localStorage.setItem(REMINDER_INACTIVE_KEY, '2026-09-30')
    localStorage.setItem(REMINDER_UNREPORTED_KEY, '2026-09-30')
    taskServiceMock.getAll.mockResolvedValue([
      task('2026-09-01T12:00:00.000Z'),
    ])
    taskServiceMock.getUnreportedInRange.mockResolvedValue([
      task('2026-09-10T12:00:00.000Z'),
    ])

    renderHookWithProviders(() => useReminder(fixedNow))

    expect(taskServiceMock.getAll).not.toHaveBeenCalled()
    expect(taskServiceMock.getUnreportedInRange).not.toHaveBeenCalled()
    expect(FakeNotification.instances).toHaveLength(0)
  })
})
