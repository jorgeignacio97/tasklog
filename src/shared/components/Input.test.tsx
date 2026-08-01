import { createRef } from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/testUtils'
import { Input } from './Input'

describe('Input (SC-3)', () => {
  it('SC-3 Happy: links the label to the input via a derived id', () => {
    renderWithProviders(<Input label="Título" />)
    const input = screen.getByLabelText('Título')
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(input.id).toBe('título')
  })

  it('SC-3 Happy: forwards the ref to the underlying input', () => {
    const ref = createRef<HTMLInputElement>()
    renderWithProviders(<Input label="Título" ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.id).toBe('título')
  })

  it('SC-3 Happy: shows the error text and the error border class', () => {
    renderWithProviders(<Input label="Título" error="Requerido" />)
    expect(screen.getByText('Requerido')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveClass('border-red-500')
  })

  it('SC-3 Happy: without error uses the normal border class and no error text', () => {
    renderWithProviders(<Input label="Título" />)
    const input = screen.getByLabelText('Título')
    expect(input).toHaveClass('border-zinc-700')
    expect(screen.queryByText(/Requerido/)).not.toBeInTheDocument()
  })
})
