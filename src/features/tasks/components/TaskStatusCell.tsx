import Badge from '../../../shared/components/Badge'
import type { Task } from '../../../shared/types'

type TaskStatusCellProps = {
  task: Task
  onToggle: (task: Task) => void
}

export function TaskStatusCell({ task, onToggle }: TaskStatusCellProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(task)}
      className="cursor-pointer transition-opacity hover:opacity-80"
      title={`Estado: ${task.status}. Clic para cambiar.`}
    >
      <Badge variant={task.status} />
    </button>
  )
}
