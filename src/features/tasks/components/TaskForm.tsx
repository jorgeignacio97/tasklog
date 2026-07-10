import { useState, useEffect, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useTask, useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { taskSchema, type TaskInput } from '../schemas/task.schema'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import { Button } from '../../../shared/components/Button'
import Card from '../../../shared/components/Card'
import type { Note } from '../../../shared/types'

interface TaskFormProps {
  taskId?: string
}

const categoryOptions = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'bug', label: 'Bug' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const TITLE_MAX = 200

export default function TaskForm({ taskId }: TaskFormProps) {
  const navigate = useNavigate()
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const { data: existingTask, isLoading: isLoadingTask } = useTask(taskId)

  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState('')

  const isEditing = !!taskId

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      status: 'pending',
      estimatedDuration: 0,
    },
  })

  // ── Load existing data when editing ─────────────────────────────────
  useEffect(() => {
    if (existingTask) {
      reset({
        title: existingTask.title,
        description: existingTask.description ?? '',
        category: existingTask.category,
        status: existingTask.status,
        estimatedDuration: existingTask.estimatedDuration,
      })
      setNotes(existingTask.notes)
    }
  }, [existingTask, reset])

  // ── Submit handler ──────────────────────────────────────────────────
  const onSubmit = (data: TaskInput) => {
    if (isEditing && taskId) {
      updateMutation.mutate(
        { id: taskId, data: { ...data, notes } },
        {
          onSuccess: () => navigate({ to: '/tasks' }),
          onError: () => {
            /* toast already handled by the hook */
          },
        },
      )
    } else {
      createMutation.mutate(
        { ...data, notes },
        {
          onSuccess: () => navigate({ to: '/tasks' }),
          onError: () => {
            /* toast already handled by the hook */
          },
        },
      )
    }
  }

  // ── Notes handlers ──────────────────────────────────────────────────
  const addNote = () => {
    const trimmed = newNoteText.trim()
    if (!trimmed) return
    const note: Note = {
      id: crypto.randomUUID(),
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, note])
    setNewNoteText('')
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addNote()
    }
  }

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  const handleNoteFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    addNote()
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  // ── Loading state for edit mode ─────────────────────────────────────
  if (isEditing && isLoadingTask) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-100">Edit Task</h1>
        <div className="h-96 animate-pulse rounded-lg bg-zinc-900" />
      </div>
    )
  }

  // ── Not found state for edit mode ───────────────────────────────────
  if (isEditing && !isLoadingTask && !existingTask) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-zinc-400">Task not found</p>
        <Button className="mt-4" onClick={() => navigate({ to: '/tasks' })}>
          Back to tasks
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">
        {isEditing ? 'Edit Task' : 'New Task'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Title ─────────────────────────────────────────────────── */}
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          maxLength={TITLE_MAX}
          {...register('title')}
        />

        {/* ── Description (textarea) ───────────────────────────────── */}
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Optional details…"
            {...register('description')}
          />
        </div>

        {/* ── Category ──────────────────────────────────────────────── */}
        <Select
          label="Category"
          options={categoryOptions}
          error={errors.category?.message}
          {...register('category')}
        />

        {/* ── Status (only show in edit mode) ──────────────────────── */}
        {isEditing && (
          <Select
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        )}

        {/* ── Estimated duration ────────────────────────────────────── */}
        <Input
          label="Estimated duration (hours)"
          type="number"
          step="0.5"
          min="0"
          placeholder="0"
          error={errors.estimatedDuration?.message}
          {...register('estimatedDuration', { valueAsNumber: true })}
        />

        {/* ── Notes section ─────────────────────────────────────────── */}
        <Card header={<span className="text-sm font-medium text-zinc-200">Notes</span>}>
          {/* Existing notes */}
          {notes.length > 0 && (
            <ul className="mb-3 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex items-start justify-between gap-2 rounded-md bg-zinc-800/50 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-zinc-300">{note.content}</span>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="mt-0.5 shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                    aria-label="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add note inline form */}
          <form onSubmit={handleNoteFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              placeholder="Add a note…"
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="submit" size="sm" disabled={!newNoteText.trim()}>
              <Plus size={14} />
              Add
            </Button>
          </form>
        </Card>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/tasks' })}
            disabled={isMutating}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isMutating}>
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  )
}
