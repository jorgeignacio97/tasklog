import { waitFor } from '@testing-library/react'
import type { Mock } from 'vitest'
import { renderHookWithProviders } from '../../../shared/utils/testUtils'
import type { ReportService } from '../services/report.service'
import { useTasks } from '../../tasks'
import {
  useReports,
  useReport,
  useCreateReport,
  useUpdateReport,
  useDeleteReport,
  useUnreportedTasks,
} from './useReports'

const { taskServiceMock, reportServiceMock, sonnerToast } = vi.hoisted(() => ({
  taskServiceMock: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByCategory: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getUnreportedInRange: vi.fn(),
  },
  reportServiceMock: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    createWithTaskLinks: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getTasksForReport: vi.fn(),
  } as { [K in keyof ReportService]: Mock<ReportService[K]> },
  sonnerToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  taskService: taskServiceMock,
  reportService: reportServiceMock,
}))

function makeReport(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'r-1',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'draft' as const,
    taskCount: 2,
    totalHours: 3,
    createdAt: '2026-07-31T12:00:00.000Z',
    updatedAt: '2026-07-31T12:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 't-1',
    title: 'Task',
    category: 'frontend' as const,
    status: 'pendiente' as const,
    estimatedDuration: 1,
    notes: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('useReports hooks (RHK-1..4)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('RHK-1 Happy: useReports returns data and settles loading', async () => {
    reportServiceMock.getAll.mockResolvedValue([
      makeReport({ id: 'r-1' }),
      makeReport({ id: 'r-2' }),
    ])

    const { result } = renderHookWithProviders(() => useReports())

    await waitFor(() =>
      expect(result.current.data?.map((r) => r.id)).toEqual(['r-1', 'r-2']),
    )
    expect(result.current.isLoading).toBe(false)
  })

  it('RHK-1 Error: useReports surfaces the rejection with no retry storm', async () => {
    reportServiceMock.getAll.mockRejectedValue(new Error('reports down'))

    const { result } = renderHookWithProviders(() => useReports())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('reports down')
    expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1)
  })

  it('RHK-1: useReport(undefined) never calls getById', async () => {
    const { result } = renderHookWithProviders(() => useReport(undefined))

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(reportServiceMock.getById).not.toHaveBeenCalled()
  })

  it('RHK-1 Happy: useReport(id) fetches by id and returns data', async () => {
    reportServiceMock.getById.mockResolvedValue(
      makeReport({ id: 'r-1', status: 'sent' }),
    )

    const { result } = renderHookWithProviders(() => useReport('r-1'))

    await waitFor(() => expect(result.current.data?.id).toBe('r-1'))
    expect(reportServiceMock.getById).toHaveBeenCalledWith('r-1')
    expect(result.current.data?.status).toBe('sent')
    expect(result.current.isLoading).toBe(false)
  })

  it('RHK-2 Happy: createWithTaskLinks called once with the report data and taskIds split apart, both key sets invalidated', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.createWithTaskLinks.mockResolvedValue(
      makeReport({ id: 'r-new' }),
    )

    const { result } = renderHookWithProviders(() => {
      useReports()
      useTasks()
      return useCreateReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'draft',
      taskCount: 2,
      totalHours: 3,
      taskIds: ['t-1', 't-2'],
    })

    // The atomic service call gets the report data and the taskIds
    // as separate arguments — never merged, never split across two calls.
    expect(reportServiceMock.createWithTaskLinks).toHaveBeenCalledTimes(1)
    expect(reportServiceMock.createWithTaskLinks).toHaveBeenCalledWith(
      {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'draft',
        taskCount: 2,
        totalHours: 3,
      },
      ['t-1', 't-2'],
    )
    // both reports and tasks invalidated → refetch
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    await waitFor(() => expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2))
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte creado')
  })

  it('RHK-2 Edge: without taskIds, createWithTaskLinks receives an empty array', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.createWithTaskLinks.mockResolvedValue(
      makeReport({ id: 'r-empty' }),
    )

    const { result } = renderHookWithProviders(() => {
      useReports()
      return useCreateReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'draft',
      taskCount: 0,
      totalHours: 0,
    })

    expect(reportServiceMock.createWithTaskLinks).toHaveBeenCalledWith(
      expect.objectContaining({ taskCount: 0 }),
      [],
    )
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte creado')
  })

  it('RHK-2 Error: a rejected atomic create rejects the mutation, toasts error, logs to console, and does not invalidate', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    reportServiceMock.createWithTaskLinks.mockRejectedValue(
      new Error('Task(s) not found: t-1'),
    )
    reportServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.getById.mockResolvedValue(makeReport({ id: 'r-1' }))

    const { result } = renderHookWithProviders(() => {
      useReports()
      useTasks()
      useReport('r-1')
      return useCreateReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )
    await waitFor(() => expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(reportServiceMock.getById).toHaveBeenCalledTimes(1),
    )

    await expect(
      result.current.mutateAsync({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'draft',
        taskCount: 1,
        totalHours: 1,
        taskIds: ['t-1'],
      }),
    ).rejects.toThrow('Task(s) not found: t-1')

    expect(sonnerToast.error).toHaveBeenCalledWith(
      'No se pudo crear el reporte',
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'No se pudo crear el reporte',
      expect.any(Error),
    )
    expect(reportServiceMock.createWithTaskLinks).toHaveBeenCalledTimes(1)
    // No invalidation: mounted query call counts unchanged inside waitFor
    // settle windows — a spurious refetch would fail these deterministically.
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )
    await waitFor(() => expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(reportServiceMock.getById).toHaveBeenCalledTimes(1),
    )
    consoleErrorSpy.mockRestore()
  })

  it('RHK-3 Happy: useUpdateReport invalidates the report and its list; detail-key refetch proven', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.update.mockResolvedValue(makeReport({ status: 'sent' }))
    reportServiceMock.getById.mockResolvedValue(
      makeReport({ id: 'r-1', status: 'sent' }),
    )

    const { result } = renderHookWithProviders(() => {
      useReports()
      useReport('r-1')
      return useUpdateReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )
    await waitFor(() =>
      expect(reportServiceMock.getById).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({ id: 'r-1', data: { status: 'sent' } })

    expect(reportServiceMock.update).toHaveBeenCalledWith('r-1', {
      status: 'sent',
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    // Detail-key refetch proven at runtime: invalidating ['reports','r-1']
    // (exact) AND ['reports'] (prefix) both match the detail observer in the
    // same synchronous block → getById fires 1 → 3 atomically (NOT 2).
    // 3 (not 2) is a known, accepted inefficiency from the two overlapping
    // invalidateQueries calls in useUpdateReport — not a bug to "fix".
    await waitFor(() =>
      expect(reportServiceMock.getById).toHaveBeenCalledTimes(3),
    )
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte actualizado')
  })

  it('RHK-3: useDeleteReport invalidates reports and tasks, toasts success', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.delete.mockResolvedValue(undefined)

    const { result } = renderHookWithProviders(() => {
      useReports()
      useTasks()
      return useDeleteReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync('r-1')

    expect(reportServiceMock.delete).toHaveBeenCalledWith('r-1')
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    await waitFor(() => expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2))
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte eliminado')
  })

  it('RHK-4 Happy: both dates defined → getUnreportedInRange called once', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue([
      makeTask({ id: 't-1' }),
    ])

    const { result } = renderHookWithProviders(() =>
      useUnreportedTasks('2026-07-01', '2026-07-31'),
    )

    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(taskServiceMock.getUnreportedInRange).toHaveBeenCalledWith(
      '2026-07-01',
      '2026-07-31',
    )
  })

  it('RHK-4 Edge: a missing date keeps the query disabled', async () => {
    const { result } = renderHookWithProviders(() =>
      useUnreportedTasks(undefined, '2026-07-31'),
    )

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(taskServiceMock.getUnreportedInRange).not.toHaveBeenCalled()
  })
})
