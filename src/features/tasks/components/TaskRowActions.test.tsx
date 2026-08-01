import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import { TaskRowActions } from './TaskRowActions'
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

describe('TaskRowActions (TC-4)', () => {
  it('TC-4 Happy: renders an edit link to /tasks/$taskId and a delete button', () => {
    const task = makeTask()
    const onDeleteClick = vi.fn()

    renderWithProviders(
      <TaskRowActions task={task} onDeleteClick={onDeleteClick} />,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/tasks/t-1')

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tarea' }))
    expect(onDeleteClick).toHaveBeenCalledTimes(1)
    expect(onDeleteClick).toHaveBeenCalledWith(task)
  })
})
