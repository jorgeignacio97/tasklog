import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import ReportHistory from './ReportHistory'
import type { Report } from '../../../shared/types'

const reportServiceMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  createWithTaskLinks: vi.fn(),
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
  reportService: reportServiceMock,
}))

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r-1',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'draft',
    taskCount: 1,
    totalHours: 2,
    createdAt: '2026-07-31T12:00:00.000Z',
    updatedAt: '2026-07-31T12:00:00.000Z',
    ...overrides,
  }
}

describe('ReportHistory (RH-1)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('RH-1 Happy: renders every report returned by the query', async () => {
    reportServiceMock.getAll.mockResolvedValue([
      makeReport({ id: 'r-1' }),
      makeReport({ id: 'r-2' }),
    ])

    renderWithProviders(<ReportHistory />)

    await waitFor(() =>
      expect(screen.getAllByText('Borrador')).toHaveLength(2),
    )
    expect(
      screen.queryByText('No se pudieron cargar los reportes'),
    ).not.toBeInTheDocument()
  })

  it('RH-1 Edge: zero reports renders the empty state, not the error state', async () => {
    reportServiceMock.getAll.mockResolvedValue([])

    renderWithProviders(<ReportHistory />)

    await waitFor(() =>
      expect(screen.getByText('Todavía no hay reportes')).toBeInTheDocument(),
    )
    expect(
      screen.queryByText('No se pudieron cargar los reportes'),
    ).not.toBeInTheDocument()
  })

  it('RH-1 Error: a rejected query renders the error state instead of the empty state, with a working retry', async () => {
    reportServiceMock.getAll
      .mockRejectedValueOnce(new Error('IndexedDB unavailable'))
      .mockResolvedValueOnce([makeReport({ id: 'r-1' })])

    renderWithProviders(<ReportHistory />)

    await waitFor(() =>
      expect(
        screen.getByText('No se pudieron cargar los reportes'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByText('Todavía no hay reportes'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() =>
      expect(
        screen.queryByText('No se pudieron cargar los reportes'),
      ).not.toBeInTheDocument(),
    )
    expect(reportServiceMock.getAll).toHaveBeenCalledTimes(2)
  })
})
