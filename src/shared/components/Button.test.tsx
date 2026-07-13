import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children text', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Guardar</Button>)
    expect(screen.getByText('Guardar').closest('button')).toBeDisabled()
  })
})
