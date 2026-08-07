import { createFileRoute } from '@tanstack/react-router'
// Direct paths, not the feature barrel: TanStack Router's autoCodeSplitting
// only splits a route's component into its own chunk when it can trace a
// direct import — going through the barrel collapses the whole app into a
// single >2MB bundle (verified: breaks the PWA precache build).
import TaskList from '../../features/tasks/components/TaskList'
import { taskListSearchSchema } from '../../features/tasks/schemas/task.schema'

export const Route = createFileRoute('/tasks/')({
  component: TaskList,
  validateSearch: taskListSearchSchema,
})
