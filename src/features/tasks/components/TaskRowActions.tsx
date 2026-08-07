import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import type { Task } from '../../../shared/types'

type TaskRowActionsProps = {
  task: Task
  onDeleteClick: (task: Task) => void
}

export function TaskRowActions({ task, onDeleteClick }: TaskRowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
        <Button variant="ghost" size="sm" aria-label="Editar tarea">
          <Pencil size={14} />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteClick(task)}
        aria-label="Eliminar tarea"
      >
        <Trash2 size={14} className="text-red-400" />
      </Button>
    </div>
  )
}
