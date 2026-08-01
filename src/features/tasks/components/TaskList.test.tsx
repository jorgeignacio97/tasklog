import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import TaskList from './TaskList'
import type { Task } from '../../../shared/types'

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

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Alpha bug',
    description: 'desc',
    category: 'bug',
    status: 'pendiente',
    estimatedDuration: 2,
    notes: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

const seedTasks: Task[] = [
  makeTask({
    id: 't-1',
    title: 'Gamma review',
    category: 'review',
    status: 'completada',
    createdAt: '2026-07-03T12:00:00.000Z',
  }),
  makeTask({
    id: 't-2',
    title: 'Alpha bug',
    createdAt: '2026-07-01T12:00:00.000Z',
  }),
  makeTask({
    id: 't-3',
    title: 'Beta frontend',
    category: 'frontend',
    status: 'en-curso',
    createdAt: '2026-07-02T12:00:00.000Z',
  }),
]

function tbodyRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('tbody tr'))
}

function firstRowTitle(container: HTMLElement): string | null {
  const firstRow = tbodyRows(container)[0]
  return firstRow?.querySelector('a')?.textContent ?? null
}

describe('TaskList (TC-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TC-2 Happy: category, status, and search filters render only matching rows', async () => {
    taskServiceMock.getAll.mockResolvedValue(seedTasks)
    const { container } = renderWithProviders(<TaskList />)

    await waitFor(() => expect(tbodyRows(container)).toHaveLength(3))

    // Category filter
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: 'bug' },
    })
    expect(tbodyRows(container)).toHaveLength(1)
    expect(screen.getByText('Alpha bug')).toBeInTheDocument()
    expect(screen.queryByText('Beta frontend')).not.toBeInTheDocument()

    // Status filter (combined)
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'completada' },
    })
    expect(tbodyRows(container)).toHaveLength(0)

    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'en-curso' },
    })
    expect(tbodyRows(container)).toHaveLength(1)
    expect(screen.getByText('Beta frontend')).toBeInTheDocument()

    // Search filter
    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'gamma' },
    })
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: '' },
    })
    expect(tbodyRows(container)).toHaveLength(1)
    expect(screen.getByText('Gamma review')).toBeInTheDocument()
  })

  it('TC-2 Happy: clicking a column header toggles the sort order', async () => {
    taskServiceMock.getAll.mockResolvedValue(seedTasks)
    const { container } = renderWithProviders(<TaskList />)

    // Wait for real data rows, not the loading skeleton
    await screen.findByText('Gamma review')
    expect(tbodyRows(container)).toHaveLength(3)
    // Seed order is [Gamma, Alpha, Beta]
    expect(firstRowTitle(container)).toBe('Gamma review')

    fireEvent.click(screen.getByRole('button', { name: 'Título' }))
    expect(firstRowTitle(container)).toBe('Alpha bug')

    fireEvent.click(screen.getByRole('button', { name: 'Título' }))
    expect(firstRowTitle(container)).toBe('Gamma review')
  })

  it('TC-2 Edge: zero tasks renders the empty state', async () => {
    taskServiceMock.getAll.mockResolvedValue([])
    renderWithProviders(<TaskList />)

    await waitFor(() =>
      expect(
        screen.getByText('Todavía no hay tareas'),
      ).toBeInTheDocument(),
    )
  })

  it('TC-2 Edge: filters matching nothing show no-results and clear-filters restores rows', async () => {
    taskServiceMock.getAll.mockResolvedValue(seedTasks)
    const { container } = renderWithProviders(<TaskList />)

    await waitFor(() => expect(tbodyRows(container)).toHaveLength(3))

    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'zzz-no-match' },
    })
    expect(
      screen.getByText('No hay tareas que coincidan con los filtros'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('Limpiar filtros'))
    expect(tbodyRows(container)).toHaveLength(3)
  })

  it('TC-2 Happy: toggling a row status calls useUpdateTask with the next status', async () => {
    taskServiceMock.getAll.mockResolvedValue(seedTasks)
    taskServiceMock.update.mockResolvedValue(seedTasks[1])

    renderWithProviders(<TaskList />)

    await waitFor(() =>
      expect(screen.getByText('Alpha bug')).toBeInTheDocument(),
    )

    fireEvent.click(
      screen.getByTitle('Estado: pendiente. Clic para cambiar.'),
    )
    await waitFor(() =>
      expect(taskServiceMock.update).toHaveBeenCalledWith('t-2', {
        status: 'en-curso',
      }),
    )
  })

  it('TC-2 Happy: deleting a task confirms in the dialog and calls useDeleteTask, then closes', async () => {
    taskServiceMock.getAll.mockResolvedValue(seedTasks)
    taskServiceMock.delete.mockResolvedValue(undefined)
    const showSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close')

    renderWithProviders(<TaskList />)

    await waitFor(() =>
      expect(screen.getByText('Alpha bug')).toBeInTheDocument(),
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Eliminar tarea' })[1],
    )
    await waitFor(() => expect(showSpy).toHaveBeenCalledTimes(1))
    expect(document.querySelector('dialog')?.open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() =>
      expect(taskServiceMock.delete).toHaveBeenCalledWith('t-2'),
    )
    await waitFor(() => expect(closeSpy).toHaveBeenCalledTimes(1))
    expect(document.querySelector('dialog')?.open).toBe(false)
  })
})
