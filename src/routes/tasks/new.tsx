import { createFileRoute } from '@tanstack/react-router'
// Direct path, not the feature barrel — see routes/tasks/index.tsx.
import TaskForm from '../../features/tasks/components/TaskForm'

export const Route = createFileRoute('/tasks/new')({
  component: () => <TaskForm />,
})
