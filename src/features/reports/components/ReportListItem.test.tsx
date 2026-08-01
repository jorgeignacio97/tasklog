import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import { ReportListItem } from './ReportListItem'
import type { Report, Task } from '../../../shared/types'

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

const { pdfMock, toBlobMock } = vi.hoisted(() => ({
  pdfMock: vi.fn(),
  toBlobMock: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  taskService: {},
  reportService: reportServiceMock,
}))

vi.mock('@react-pdf/renderer', () => ({
  pdf: pdfMock,
  Document: (props: { children?: unknown }) => props.children ?? null,
  Page: (props: { children?: unknown }) => props.children ?? null,
  View: (props: { children?: unknown }) => props.children ?? null,
  Text: (props: { children?: unknown }) => props.children ?? null,
  StyleSheet: { create: (styles: unknown) => styles },
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

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Task',
    category: 'frontend',
    status: 'completada',
    estimatedDuration: 2,
    notes: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

const noOp = () => {}
const originalCreateElement = document.createElement.bind(document)

function getDownloadButton() {
  return screen.getByRole('button', { name: /descargar pdf/i })
}

describe('ReportListItem PDF download (RLI-1)', () => {
  let capturedAnchor: HTMLAnchorElement | null

  beforeEach(() => {
    vi.clearAllMocks()
    capturedAnchor = null
    toBlobMock.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
    pdfMock.mockReturnValue({ toBlob: toBlobMock })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') capturedAnchor = el as HTMLAnchorElement
      return el
    })
  })

  it('RLI-1 Happy: clicking download fetches tasks, generates the PDF, and attaches the blob URL to the anchor', async () => {
    const report = makeReport()
    const tasks = [makeTask()]
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' })
    toBlobMock.mockResolvedValue(mockBlob)
    reportServiceMock.getTasksForReport.mockResolvedValue(tasks)

    renderWithProviders(
      <ReportListItem
        report={report}
        onMarkSent={noOp}
        onDelete={noOp}
        isMarkingSent={false}
        isDeleting={false}
      />,
    )

    fireEvent.click(getDownloadButton())

    await waitFor(() =>
      expect(reportServiceMock.getTasksForReport).toHaveBeenCalledWith('r-1'),
    )
    await waitFor(() => expect(pdfMock).toHaveBeenCalledTimes(1))

    const pdfElement = pdfMock.mock.calls[0][0]
    expect(pdfElement.props.report).toBe(report)
    expect(pdfElement.props.tasks).toBe(tasks)

    await waitFor(() => expect(toBlobMock).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1),
    )

    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    expect(capturedAnchor).not.toBeNull()
    expect(capturedAnchor?.href).toBe('blob:mock-url')
    expect(capturedAnchor?.download).toBe('reporte-r-1.pdf')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(sonnerToast.error).not.toHaveBeenCalled()
  })

  it('RLI-1 Edge: the button shows a loading state while tasks are being fetched', async () => {
    let resolveTasks: (tasks: Task[]) => void = () => {}
    reportServiceMock.getTasksForReport.mockReturnValue(
      new Promise((resolve) => {
        resolveTasks = resolve
      }),
    )

    renderWithProviders(
      <ReportListItem
        report={makeReport()}
        onMarkSent={noOp}
        onDelete={noOp}
        isMarkingSent={false}
        isDeleting={false}
      />,
    )

    const downloadButton = getDownloadButton()
    fireEvent.click(downloadButton)

    await waitFor(() => expect(downloadButton).toBeDisabled())

    resolveTasks([makeTask()])

    await waitFor(() => expect(downloadButton).toBeEnabled())
  })

  it('RLI-1 Edge: double-clicking only triggers one fetch and one PDF generation', async () => {
    reportServiceMock.getTasksForReport.mockResolvedValue([makeTask()])

    renderWithProviders(
      <ReportListItem
        report={makeReport()}
        onMarkSent={noOp}
        onDelete={noOp}
        isMarkingSent={false}
        isDeleting={false}
      />,
    )

    const downloadButton = getDownloadButton()
    fireEvent.click(downloadButton)
    fireEvent.click(downloadButton)

    await waitFor(() => expect(pdfMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(downloadButton).toBeEnabled())

    expect(reportServiceMock.getTasksForReport).toHaveBeenCalledTimes(1)
    expect(pdfMock).toHaveBeenCalledTimes(1)
  })

  it('RLI-1 Error: a rejected task fetch shows an error toast without crashing', async () => {
    reportServiceMock.getTasksForReport.mockRejectedValue(
      new Error('fetch failed'),
    )

    renderWithProviders(
      <ReportListItem
        report={makeReport()}
        onMarkSent={noOp}
        onDelete={noOp}
        isMarkingSent={false}
        isDeleting={false}
      />,
    )

    const downloadButton = getDownloadButton()
    fireEvent.click(downloadButton)

    await waitFor(() =>
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'No se pudo generar el PDF del reporte',
      ),
    )
    expect(pdfMock).not.toHaveBeenCalled()
    await waitFor(() => expect(downloadButton).toBeEnabled())
  })

  it('RLI-1 Error: a rejected pdf().toBlob() shows an error toast without crashing', async () => {
    reportServiceMock.getTasksForReport.mockResolvedValue([makeTask()])
    toBlobMock.mockRejectedValue(new Error('render failed'))

    renderWithProviders(
      <ReportListItem
        report={makeReport()}
        onMarkSent={noOp}
        onDelete={noOp}
        isMarkingSent={false}
        isDeleting={false}
      />,
    )

    const downloadButton = getDownloadButton()
    fireEvent.click(downloadButton)

    await waitFor(() =>
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'No se pudo generar el PDF del reporte',
      ),
    )
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
    await waitFor(() => expect(downloadButton).toBeEnabled())
  })
})
