import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import ReportBuilder from './ReportBuilder'
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

const reportServiceMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getTasksForReport: vi.fn(),
}))

const sonnerToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  taskService: taskServiceMock,
  reportService: reportServiceMock,
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Frontend task',
    description: '',
    category: 'frontend',
    status: 'pendiente',
    estimatedDuration: 2,
    notes: [],
    createdAt: '2026-07-10T12:00:00.000Z',
    updatedAt: '2026-07-10T12:00:00.000Z',
    ...overrides,
  }
}

const previewTasks: Task[] = [
  makeTask({ id: 't-1', title: 'Frontend task' }),
  makeTask({
    id: 't-2',
    title: 'Backend task',
    category: 'backend',
    estimatedDuration: 1,
  }),
]

async function setDateRange() {
  fireEvent.change(screen.getByLabelText('Fecha inicio'), {
    target: { value: '2026-07-01' },
  })
  fireEvent.change(screen.getByLabelText('Fecha fin'), {
    target: { value: '2026-07-31' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Vista previa/ }))
}

// Waits until the preview query has resolved (loading placeholder gone).
async function waitForPreviewData() {
  await waitFor(() =>
    expect(
      screen.queryByText('Cargando tareas…'),
    ).not.toBeInTheDocument(),
  )
}

describe('ReportBuilder (RB-1..3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('RB-1: SummaryCards keeps a stable element identity across an unrelated re-render', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue(previewTasks)
    // Keep the create mutation pending so its isPending state change re-renders
    // the builder without altering SummaryCards' props
    reportServiceMock.create.mockImplementation(() => new Promise(() => {}))
    const { container } = renderWithProviders(<ReportBuilder />)

    await setDateRange()

    // While the preview query loads, the summary cards grid is already mounted
    const cardsWhileLoading = container.querySelector('.grid')
    expect(cardsWhileLoading).not.toBeNull()

    // Data arriving triggers a re-render
    await waitForPreviewData()
    const cardsAfterLoad = container.querySelector('.grid')
    expect(cardsAfterLoad).toBe(cardsWhileLoading)

    // A second, fully unrelated re-render (mutation pending state)
    fireEvent.click(screen.getByRole('button', { name: /Generar reporte/ }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Generar reporte/ }),
      ).toBeDisabled(),
    )
    const cardsAfterMutation = container.querySelector('.grid')
    expect(cardsAfterMutation).toBe(cardsAfterLoad)
  })

  it('RB-2 Edge: the preview button is disabled until both dates are set', () => {
    renderWithProviders(<ReportBuilder />)

    const previewButton = screen.getByRole('button', { name: /Vista previa/ })
    expect(previewButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Fecha inicio'), {
      target: { value: '2026-07-01' },
    })
    expect(previewButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Fecha fin'), {
      target: { value: '2026-07-31' },
    })
    expect(previewButton).toBeEnabled()
  })

  it('RB-2 Happy: preview shows the three summary cards with correct counts', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue(previewTasks)

    const { container } = renderWithProviders(<ReportBuilder />)
    await setDateRange()
    await waitForPreviewData()

    const grid = container.querySelector('.grid')
    expect(grid).not.toBeNull()
    // 2 unreported tasks → count card; 2 categories → category card
    expect(within(grid as HTMLElement).getAllByText('2')).toHaveLength(2)
    expect(within(grid as HTMLElement).getByText('3h')).toBeInTheDocument()
    expect(screen.getByText('Total tareas')).toBeInTheDocument()
    expect(screen.getByText('Total horas')).toBeInTheDocument()
    expect(screen.getByText('Categorías')).toBeInTheDocument()
  })

  it('RB-2 Happy: preview groups tasks by category with per-group totals', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue(previewTasks)

    renderWithProviders(<ReportBuilder />)
    await setDateRange()
    await waitForPreviewData()

    expect(screen.getByText('Frontend task')).toBeInTheDocument()
    expect(screen.getByText('Backend task')).toBeInTheDocument()
    // Group headers: 1 task · duration per category
    expect(screen.getByText('1 tarea · 2h')).toBeInTheDocument()
    expect(screen.getByText('1 tarea · 1h')).toBeInTheDocument()
  })

  it('RB-2 Edge: editing a date clears the preview', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue(previewTasks)
    const { container } = renderWithProviders(<ReportBuilder />)

    await setDateRange()
    await waitForPreviewData()
    expect(container.querySelector('.grid')).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Fecha inicio'), {
      target: { value: '2026-07-15' },
    })

    expect(container.querySelector('.grid')).toBeNull()
    expect(
      screen.getByText(/Selecciona un rango de fechas/),
    ).toBeInTheDocument()
  })

  it('RB-2 Edge: an empty range shows the no-tasks message', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue([])

    renderWithProviders(<ReportBuilder />)
    await setDateRange()
    await waitForPreviewData()

    expect(
      screen.getByText('No hay tareas sin reportar en este rango.'),
    ).toBeInTheDocument()
  })

  it('RB-3 Happy: Generar reporte sends the payload and navigates to /reports/history', async () => {
    taskServiceMock.getUnreportedInRange.mockResolvedValue(previewTasks)
    reportServiceMock.create.mockResolvedValue({
      id: 'r-1',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'draft',
      taskCount: 2,
      totalHours: 3,
      createdAt: '2026-07-31T12:00:00.000Z',
      updatedAt: '2026-07-31T12:00:00.000Z',
    })

    const { router } = renderWithProviders(<ReportBuilder />)
    await setDateRange()
    await waitForPreviewData()

    fireEvent.click(screen.getByRole('button', { name: /Generar reporte/ }))

    await waitFor(() =>
      expect(reportServiceMock.create).toHaveBeenCalledWith({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'draft',
        taskCount: 2,
        totalHours: 3,
      }),
    )
    // taskIds are destructured out of the create payload and applied via update
    expect(taskServiceMock.update).toHaveBeenCalledWith('t-1', {
      reportedInReportId: 'r-1',
    })
    expect(taskServiceMock.update).toHaveBeenCalledWith('t-2', {
      reportedInReportId: 'r-1',
    })
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/reports/history'),
    )
  })
})
