import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../shared/utils/testUtils'
import type { ReportService } from '../services/report.service'
import { useTasks } from '../../tasks/hooks/useTasks'
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
    update: vi.fn(),
    delete: vi.fn(),
    getTasksForReport: vi.fn(),
  } as Partial<ReportService>,
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
    vi.clearAllMocks()
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

  it('RHK-2 Happy: create once without taskIds, update once per task, both key sets invalidated', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.create.mockResolvedValue(makeReport({ id: 'r-new' }))
    taskServiceMock.update.mockResolvedValue(makeTask())

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

    // create called exactly once, payload WITHOUT taskIds
    expect(reportServiceMock.create).toHaveBeenCalledTimes(1)
    expect(reportServiceMock.create).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'draft',
      taskCount: 2,
      totalHours: 3,
    })
    // update called once per task with the new report id
    expect(taskServiceMock.update).toHaveBeenCalledTimes(2)
    expect(taskServiceMock.update).toHaveBeenCalledWith('t-1', {
      reportedInReportId: 'r-new',
    })
    expect(taskServiceMock.update).toHaveBeenCalledWith('t-2', {
      reportedInReportId: 'r-new',
    })
    // both reports and tasks invalidated → refetch
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    await waitFor(() => expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2))
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte creado')
  })

  it('RHK-2 Edge: without taskIds, taskService.update is never called', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.create.mockResolvedValue(makeReport({ id: 'r-empty' }))

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

    expect(reportServiceMock.create).toHaveBeenCalledTimes(1)
    expect(taskServiceMock.update).not.toHaveBeenCalled()
    expect(sonnerToast.success).toHaveBeenCalledWith('Reporte creado')
  })

  it('RHK-2 Error: a rejected task update rejects the mutation and toasts error', async () => {
    reportServiceMock.create.mockResolvedValue(makeReport({ id: 'r-new' }))
    taskServiceMock.update.mockRejectedValue(new Error('link failed'))

    const { result } = renderHookWithProviders(() => useCreateReport())

    await expect(
      result.current.mutateAsync({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'draft',
        taskCount: 1,
        totalHours: 1,
        taskIds: ['t-1'],
      }),
    ).rejects.toThrow('link failed')

    expect(sonnerToast.error).toHaveBeenCalledWith('No se pudo crear el reporte')
    expect(reportServiceMock.create).toHaveBeenCalledTimes(1)
  })

  it('RHK-3 Happy: useUpdateReport invalidates the report and its list', async () => {
    reportServiceMock.getAll.mockResolvedValue([])
    reportServiceMock.update.mockResolvedValue(makeReport({ status: 'sent' }))

    const { result } = renderHookWithProviders(() => {
      useReports()
      return useUpdateReport()
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({ id: 'r-1', data: { status: 'sent' } })

    expect(reportServiceMock.update).toHaveBeenCalledWith('r-1', {
      status: 'sent',
    })
    await waitFor(() =>
      expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2),
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
