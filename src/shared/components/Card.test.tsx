import { renderWithProviders } from '../utils/testUtils'
import Card from './Card'

describe('Card (SC-2)', () => {
  it('SC-2 Happy: renders header, children, and footer in order', () => {
    const { container } = renderWithProviders(
      <Card header={<h2>Header</h2>} footer={<footer>Footer</footer>}>
        Body
      </Card>,
    )

    const text = container.textContent ?? ''
    expect(text.indexOf('Header')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('Header')).toBeLessThan(text.indexOf('Body'))
    expect(text.indexOf('Body')).toBeLessThan(text.indexOf('Footer'))
  })

  it('SC-2 Happy: merges the className prop into the root', () => {
    const { container } = renderWithProviders(
      <Card className="custom-card">Body</Card>,
    )
    const root = container.firstElementChild
    expect(root).not.toBeNull()
    expect(root).toHaveClass('rounded-lg')
    expect(root).toHaveClass('custom-card')
  })

  it('SC-2 Edge: renders children alone when header and footer are absent', () => {
    renderWithProviders(<Card>Only body</Card>)
    const text = document.body.textContent ?? ''
    expect(text).toContain('Only body')
  })
})
