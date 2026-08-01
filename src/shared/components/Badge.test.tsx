import { screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/testUtils'
import Badge from './Badge'
import type { TaskCategory, TaskStatus, ReportStatus } from '../types'

type BadgeVariant = TaskCategory | TaskStatus | ReportStatus

describe('Badge (SC-1)', () => {
  it('SC-1 Happy: renders the label for a known variant', () => {
    renderWithProviders(<Badge variant="pendiente" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('SC-1 Edge: falls back to the "other" color for an unknown variant with no label text', () => {
    const { container } = renderWithProviders(
      <Badge variant={'x' as BadgeVariant} />,
    )
    const badge = container.querySelector('span')
    expect(badge).not.toBeNull()
    // The unknown-variant fallback applies only to the color class; the label
    // has no fallback, so no text renders.
    expect(badge).toHaveClass('bg-zinc-500/20')
    expect(badge?.textContent).toBe('')
  })
})
