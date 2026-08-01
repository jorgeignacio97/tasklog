import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../utils/testUtils'
import Modal from './Modal'

describe('Modal (SC-5)', () => {
  it('SC-5 Happy: isOpen true calls showModal once; false closes; open state stays truthful', async () => {
    const showSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close')
    const onClose = vi.fn()

    const { rerender } = renderWithProviders(
      <Modal isOpen onClose={onClose} title="Eliminar tarea">
        <p>¿Seguro?</p>
      </Modal>,
    )

    expect(screen.getByText('Eliminar tarea')).toBeInTheDocument()
    expect(screen.getByText('¿Seguro?')).toBeInTheDocument()

    await waitFor(() => expect(showSpy).toHaveBeenCalledTimes(1))
    expect(closeSpy).not.toHaveBeenCalled()
    expect(document.querySelector('dialog')?.open).toBe(true)

    rerender(
      <Modal isOpen={false} onClose={onClose} title="Eliminar tarea">
        <p>¿Seguro?</p>
      </Modal>,
    )

    await waitFor(() => expect(closeSpy).toHaveBeenCalledTimes(1))
    expect(document.querySelector('dialog')?.open).toBe(false)
  })
})
