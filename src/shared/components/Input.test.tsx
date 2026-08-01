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

  it('SC-3 Happy: shows the error text', () => {
    renderWithProviders(<Input label="Título" error="Requerido" />)
    expect(screen.getByText('Requerido')).toBeInTheDocument()
  })
})
