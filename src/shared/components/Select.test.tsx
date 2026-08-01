import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/testUtils'
import { Select } from './Select'

const options = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'bug', label: 'Bug' },
]

describe('Select (SC-4)', () => {
  it('SC-4 Happy: renders the label linked to the select', () => {
    renderWithProviders(<Select label="Categoría" options={options} />)
    const select = screen.getByLabelText('Categoría')
    expect(select).toBeInstanceOf(HTMLSelectElement)
    expect(select.id).toBe('categoría')
  })

  it('SC-4 Happy: renders the placeholder first, disabled, and every option', () => {
    renderWithProviders(
      <Select label="Categoría" options={options} placeholder="Elegí…" />,
    )

    const placeholder = screen.getByRole('option', { name: 'Elegí…' })
    expect(placeholder).toHaveAttribute('value', '')
    expect(placeholder).toBeDisabled()

    const allOptions = screen.getAllByRole('option')
    expect(allOptions.map((o) => o.textContent)).toEqual([
      'Elegí…',
      'Frontend',
      'Backend',
      'Bug',
    ])
  })

  it('SC-4 Happy: shows the error text', () => {
    renderWithProviders(
      <Select label="Categoría" options={options} error="Obligatorio" />,
    )
    expect(screen.getByText('Obligatorio')).toBeInTheDocument()
  })
})
