import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import { TaskStatusCell } from './TaskStatusCell'
import type { Task } from '../../../shared/types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Fix layout',
    category: 'frontend',
    status: 'pendiente',
    estimatedDuration: 2,
    notes: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('TaskStatusCell (TC-3)', () => {
  it('TC-3 Happy: renders the status Badge and calls onToggle(task) on click', () => {
    const task = makeTask()
    const onToggle = vi.fn()

    renderWithProviders(<TaskStatusCell task={task} onToggle={onToggle} />)

    expect(screen.getByText('Pendiente')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith(task)
  })
})
