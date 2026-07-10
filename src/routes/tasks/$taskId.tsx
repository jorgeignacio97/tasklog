import { createFileRoute, useParams } from '@tanstack/react-router'
import TaskForm from '../../features/tasks/components/TaskForm'

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetail,
})

function TaskDetail() {
  const { taskId } = useParams({ from: '/tasks/$taskId' })
  return <TaskForm taskId={taskId} />
}
