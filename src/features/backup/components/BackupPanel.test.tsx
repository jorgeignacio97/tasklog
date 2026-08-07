import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import BackupPanel from './BackupPanel'
import type { BackupData } from '../schemas/backup.schema'

const backupServiceMock = vi.hoisted(() => ({
  exportData: vi.fn(),
  importData: vi.fn(),
}))

const sonnerToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  backupService: backupServiceMock,
}))

const sampleBackup: BackupData = {
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  tasks: [],
  reports: [],
}

function makeFile(content: unknown): File {
  return new File([JSON.stringify(content)], 'backup.json', {
    type: 'application/json',
  })
}

describe('BackupPanel (BP-1..3)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('BP-1: exporting triggers a download and a success toast', async () => {
    backupServiceMock.exportData.mockResolvedValue(sampleBackup)

    renderWithProviders(<BackupPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Exportar datos/ }))

    await waitFor(() => expect(backupServiceMock.exportData).toHaveBeenCalled())
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    expect(sonnerToast.success).toHaveBeenCalledWith('Datos exportados')
  })

  it('BP-1 Edge: a failed export shows an error toast, not a success one', async () => {
    backupServiceMock.exportData.mockRejectedValue(new Error('boom'))

    renderWithProviders(<BackupPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Exportar datos/ }))

    await waitFor(() =>
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'No se pudieron exportar los datos',
      ),
    )
    expect(sonnerToast.success).not.toHaveBeenCalled()
  })

  it('BP-2 Happy: selecting a file shows the confirm modal, and confirming imports + invalidates queries', async () => {
    backupServiceMock.importData.mockResolvedValue(undefined)

    const { queryClient } = renderWithProviders(<BackupPanel />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const input = screen.getByLabelText('Importar archivo de backup')
    fireEvent.change(input, { target: { files: [makeFile(sampleBackup)] } })

    expect(
      screen.getByText(
        'Esto reemplazará todos los datos actuales. Esta acción no se puede deshacer.',
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Reemplazar datos/ }))

    await waitFor(() =>
      expect(backupServiceMock.importData).toHaveBeenCalledWith(sampleBackup),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] })
    await waitFor(() =>
      expect(sonnerToast.success).toHaveBeenCalledWith('Datos importados'),
    )
  })

  it('BP-3 Edge: a file over 10MB is rejected before reading it, with no confirm modal', async () => {
    renderWithProviders(<BackupPanel />)

    const input = screen.getByLabelText('Importar archivo de backup')
    const oversizedFile = makeFile(sampleBackup)
    Object.defineProperty(oversizedFile, 'size', {
      value: 11 * 1024 * 1024,
    })

    fireEvent.change(input, { target: { files: [oversizedFile] } })

    await waitFor(() =>
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'El archivo es demasiado grande (máximo 10MB). Verificá que sea un backup válido de TaskLog.',
      ),
    )
    expect(document.querySelector('dialog')?.open).not.toBe(true)
    expect(backupServiceMock.importData).not.toHaveBeenCalled()
  })

  it('BP-3 Edge: an invalid file shows an error toast and never calls importData with unparsable JSON', async () => {
    renderWithProviders(<BackupPanel />)

    const input = screen.getByLabelText('Importar archivo de backup')
    const invalidFile = new File(['not json'], 'backup.json', {
      type: 'application/json',
    })
    fireEvent.change(input, { target: { files: [invalidFile] } })

    fireEvent.click(screen.getByRole('button', { name: /Reemplazar datos/ }))

    await waitFor(() =>
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'No se pudo importar el archivo. Tus datos actuales no se modificaron.',
      ),
    )
    expect(backupServiceMock.importData).not.toHaveBeenCalled()
  })

  it('BP-3 Edge: cancelling the confirm modal does not call importData', async () => {
    renderWithProviders(<BackupPanel />)

    const input = screen.getByLabelText('Importar archivo de backup')
    fireEvent.change(input, { target: { files: [makeFile(sampleBackup)] } })

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(backupServiceMock.importData).not.toHaveBeenCalled()
  })
})
