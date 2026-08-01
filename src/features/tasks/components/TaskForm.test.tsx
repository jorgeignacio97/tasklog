import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../shared/utils/testUtils'
import TaskForm from './TaskForm'
import type { Task } from '../../../shared/types'

const taskServiceMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByCategory: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUnreportedInRange: vi.fn(),
}))

const sonnerToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: sonnerToast }))

vi.mock('../../../lib/services', () => ({
  taskService: taskServiceMock,
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Existing title',
    description: 'Existing description',
    category: 'bug',
    status: 'en-curso',
    estimatedDuration: 3,
    notes: [
      { id: 'n-1', content: 'nota original', createdAt: '2026-07-01T12:00:00.000Z' },
    ],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

async function fillValidForm() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Título'), 'Nueva tarea')
  fireEvent.change(screen.getByLabelText('Categoría'), {
    target: { value: 'frontend' },
  })
  await user.type(screen.getByLabelText('Duración estimada (horas)'), '2')
  return user
}

describe('TaskForm (TC-1)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('TC-1 Error: empty title blocks submit with an inline error and no mutation', async () => {
    const user = userEvent.setup()
    taskServiceMock.create.mockResolvedValue(makeTask())

    renderWithProviders(<TaskForm />)

    await user.click(screen.getByRole('button', { name: 'Crear tarea' }))

    await waitFor(() =>
      expect(screen.getByText(/too small/i)).toBeInTheDocument(),
    )
    expect(taskServiceMock.create).not.toHaveBeenCalled()
  })

  it('TC-1 Error: a too-long title blocks submit with an inline error and no mutation', async () => {
    const user = userEvent.setup()
    taskServiceMock.create.mockResolvedValue(makeTask())

    renderWithProviders(<TaskForm />)

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'x'.repeat(201) },
    })
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }))

    await waitFor(() =>
      expect(screen.getByText(/too big/i)).toBeInTheDocument(),
    )
    expect(taskServiceMock.create).not.toHaveBeenCalled()
  })

  it('TC-1 Happy: valid submit creates the task with values and notes, then navigates to /tasks', async () => {
    taskServiceMock.create.mockResolvedValue(makeTask({ id: 't-new' }))

    const { router } = renderWithProviders(<TaskForm />)
    const user = await fillValidForm()

    await user.click(screen.getByRole('button', { name: 'Crear tarea' }))

    await waitFor(() =>
      expect(taskServiceMock.create).toHaveBeenCalledWith({
        title: 'Nueva tarea',
        description: '',
        category: 'frontend',
        status: 'pendiente',
        estimatedDuration: 2,
        notes: [],
      }),
    )
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/tasks'),
    )
  })

  it('TC-1 Happy: edit mode prefills from getById and updates on submit', async () => {
    taskServiceMock.getById.mockResolvedValue(makeTask())
    taskServiceMock.update.mockResolvedValue(makeTask())

    const { router } = renderWithProviders(<TaskForm taskId="t-1" />)

    await waitFor(() =>
      expect(screen.getByLabelText('Título')).toHaveValue('Existing title'),
    )
    expect(screen.getByLabelText('Categoría')).toHaveValue('bug')
    expect(screen.getByLabelText('Estado')).toHaveValue('en-curso')
    expect(screen.getByText('nota original')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('Título'))
    await user.type(screen.getByLabelText('Título'), 'Edited title')
    await user.click(
      screen.getByRole('button', { name: 'Actualizar tarea' }),
    )

    await waitFor(() =>
      expect(taskServiceMock.update).toHaveBeenCalledWith(
        't-1',
        expect.objectContaining({
          title: 'Edited title',
          category: 'bug',
          status: 'en-curso',
          estimatedDuration: 3,
          notes: [expect.objectContaining({ content: 'nota original' })],
        }),
      ),
    )
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/tasks'),
    )
  })

  it('TC-1 Happy: notes can be added and deleted before submit', async () => {
    taskServiceMock.create.mockResolvedValue(makeTask())
    const user = userEvent.setup()

    renderWithProviders(<TaskForm />)

    await user.type(
      screen.getByPlaceholderText('Agregar una nota…'),
      'nota uno',
    )
    await user.click(screen.getByRole('button', { name: /Agregar/ }))
    expect(screen.getByText('nota uno')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Eliminar nota' }))
    expect(screen.queryByText('nota uno')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Título'), 'Con notas')
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }))

    await waitFor(() =>
      expect(taskServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Con notas',
          notes: [],
        }),
      ),
    )
  })
})
