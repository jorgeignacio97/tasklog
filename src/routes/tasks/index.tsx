import { createFileRoute } from '@tanstack/react-router'
import TaskList from '../../features/tasks/components/TaskList'

export const Route = createFileRoute('/tasks/')({
  component: TaskList,
})
