import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../shared/utils/testUtils'
import type { TaskCategory } from '../../../shared/types'
import type { CreateTaskInput } from '../services/task.service'
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasksByCategory,
} from './useTasks'

const taskServiceMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByCategory: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUnreportedInRange: vi.fn(),
}))

const sonnerToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  taskService: taskServiceMock,
}))

function makeTask(overrides: Partial<CreateTaskInput & { id: string }> = {}) {
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

describe('useTasks hooks (THK-1..3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('THK-1 Happy: useTasks returns data and settles loading', async () => {
    taskServiceMock.getAll.mockResolvedValue([
      makeTask({ id: 't-1', title: 'Alpha' }),
      makeTask({ id: 't-2', title: 'Beta' }),
    ])

    const { result } = renderHookWithProviders(() => useTasks())

    await waitFor(() =>
      expect(result.current.data?.map((t) => t.title)).toEqual([
        'Alpha',
        'Beta',
      ]),
    )
    expect(result.current.isLoading).toBe(false)
  })

  it('THK-1 Error: useTasks surfaces the rejection with no retry storm', async () => {
    taskServiceMock.getAll.mockRejectedValue(new Error('db exploded'))

    const { result } = renderHookWithProviders(() => useTasks())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('db exploded')
    expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1)
  })

  it('THK-2 Edge: useTask(undefined) never calls getById', async () => {
    const { result } = renderHookWithProviders(() => useTask(undefined))

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(taskServiceMock.getById).not.toHaveBeenCalled()
  })

  it('THK-2 Happy: useTask(id) fetches by id; useTasksByCategory keys queries by category', async () => {
    taskServiceMock.getById.mockResolvedValue(makeTask({ id: 't-1' }))
    taskServiceMock.getByCategory.mockResolvedValue([
      makeTask({ id: 't-1', category: 'bug', title: 'Bug one' }),
    ])

    const taskResult = renderHookWithProviders(() => useTask('t-1'))
    await waitFor(() => expect(taskResult.result.current.data?.id).toBe('t-1'))
    expect(taskServiceMock.getById).toHaveBeenCalledWith('t-1')

    let category: TaskCategory = 'bug'
    const categoryResult = renderHookWithProviders(() =>
      useTasksByCategory(category),
    )
    await waitFor(() =>
      expect(categoryResult.result.current.data).toHaveLength(1),
    )
    expect(categoryResult.result.current.data?.[0].title).toBe('Bug one')

    category = 'frontend'
    categoryResult.rerender()
    await waitFor(() =>
      expect(taskServiceMock.getByCategory).toHaveBeenLastCalledWith(
        'frontend',
      ),
    )
    expect(taskServiceMock.getByCategory.mock.calls.map((c) => c[0])).toEqual([
      'bug',
      'frontend',
    ])
  })

  it('THK-3 Happy: useCreateTask invalidates tasks and toasts success', async () => {
    taskServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.create.mockResolvedValue(makeTask({ id: 't-new' }))

    const { result } = renderHookWithProviders(() => {
      useTasks()
      return useCreateTask()
    })
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({
      title: 'New task',
      category: 'frontend',
      status: 'pendiente',
      estimatedDuration: 2,
      notes: [],
    })

    // Invalidation triggers a refetch of the active useTasks query
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    expect(sonnerToast.success).toHaveBeenCalledWith('Tarea creada')
  })

  it('THK-3 Error: a rejected mutation toasts error and does not invalidate', async () => {
    taskServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.create.mockRejectedValue(new Error('create failed'))

    const { result } = renderHookWithProviders(() => {
      useTasks()
      return useCreateTask()
    })
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await expect(
      result.current.mutateAsync({
        title: 'Doomed',
        category: 'bug',
        status: 'pendiente',
        estimatedDuration: 1,
        notes: [],
      }),
    ).rejects.toThrow('create failed')

    expect(sonnerToast.error).toHaveBeenCalledWith('No se pudo crear la tarea')
    expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1)
  })

  it('THK-3: useUpdateTask invalidates tasks and toasts success', async () => {
    taskServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.update.mockResolvedValue(
      makeTask({ id: 't-1', title: 'Renamed' }),
    )

    const { result } = renderHookWithProviders(() => {
      useTasks()
      return useUpdateTask()
    })
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync({
      id: 't-1',
      data: { title: 'Renamed' },
    })

    expect(taskServiceMock.update).toHaveBeenCalledWith('t-1', {
      title: 'Renamed',
    })
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    expect(sonnerToast.success).toHaveBeenCalledWith('Tarea actualizada')
  })

  it('THK-3: useDeleteTask invalidates tasks and toasts success', async () => {
    taskServiceMock.getAll.mockResolvedValue([])
    taskServiceMock.delete.mockResolvedValue(undefined)

    const { result } = renderHookWithProviders(() => {
      useTasks()
      return useDeleteTask()
    })
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(1),
    )

    await result.current.mutateAsync('t-1')

    expect(taskServiceMock.delete).toHaveBeenCalledWith('t-1')
    await waitFor(() =>
      expect(taskServiceMock.getAll).toHaveBeenCalledTimes(2),
    )
    expect(sonnerToast.success).toHaveBeenCalledWith('Tarea eliminada')
  })
})
