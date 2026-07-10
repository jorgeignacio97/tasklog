import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import Card from '../../../shared/components/Card'
import Badge from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import { formatDuration } from '../../../shared/utils/cn'
import type { Task, TaskStatus } from '../../../shared/types'

interface TaskCardProps {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pending: 'in-progress',
  'in-progress': 'completed',
  completed: 'completed',
}

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const firstNote = task.notes[0]
  const notePreview =
    firstNote && firstNote.content.length > 80
      ? firstNote.content.slice(0, 80) + '…'
      : firstNote?.content

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              to="/tasks/$taskId"
              params={{ taskId: task.id }}
              className="text-base font-medium text-zinc-100 transition-colors hover:text-indigo-400"
            >
              {task.title}
            </Link>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Badge variant={task.category} />
              <button
                type="button"
                onClick={() => onStatusChange(task.id, nextStatus[task.status])}
                className="cursor-pointer transition-opacity hover:opacity-80"
                title={`Status: ${task.status}. Click to cycle.`}
              >
                <Badge variant={task.status} />
              </button>
            </div>
            {task.estimatedDuration > 0 && (
              <p className="mt-1.5 text-xs text-zinc-500">
                {formatDuration(task.estimatedDuration)}
              </p>
            )}
            {notePreview && (
              <p className="mt-1.5 truncate text-sm text-zinc-400">{notePreview}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
              <Button variant="ghost" size="sm" aria-label="Edit task">
                <Pencil size={14} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              aria-label="Delete task"
            >
              <Trash2 size={14} className="text-red-400" />
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete task"
      >
        <p className="mb-4 text-sm text-zinc-300">
          Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onDelete(task.id)
              setShowDeleteModal(false)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
