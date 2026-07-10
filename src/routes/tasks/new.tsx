import { createFileRoute } from '@tanstack/react-router'
import TaskForm from '../../features/tasks/components/TaskForm'

export const Route = createFileRoute('/tasks/new')({
  component: () => <TaskForm />,
})
