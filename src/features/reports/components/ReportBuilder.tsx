import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Calendar, Eye, FileText, Clock, ListTree, Loader2 } from 'lucide-react'
import Card from '../../../shared/components/Card'
import Badge from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { formatDuration, formatDate } from '../../../shared/utils/cn'
import { useUnreportedTasks, useCreateReport } from '../hooks/useReports'
import type { Task, TaskCategory } from '../../../shared/types'

const categoryOrder: TaskCategory[] = ['frontend', 'backend', 'bug', 'review', 'other']

export default function ReportBuilder() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const navigate = useNavigate()
  const createReport = useCreateReport()

  const { data: unreportedTasks, isLoading: isLoadingPreview } = useUnreportedTasks(
    showPreview ? startDate : undefined,
    showPreview ? endDate : undefined,
  )

  const tasksByCategory = useMemo(() => {
    if (!unreportedTasks) return new Map<TaskCategory, Task[]>()
    const map = new Map<TaskCategory, Task[]>()
    for (const cat of categoryOrder) {
      const tasks = unreportedTasks.filter((t) => t.category === cat)
      if (tasks.length > 0) map.set(cat, tasks)
    }
    return map
  }, [unreportedTasks])

  const totalHours = useMemo(
    () => unreportedTasks?.reduce((sum, t) => sum + t.estimatedDuration, 0) ?? 0,
    [unreportedTasks],
  )

  const categoryCount = tasksByCategory.size

  const handlePreview = () => {
    if (!startDate || !endDate) return
    setShowPreview(true)
  }

  const handleGenerate = () => {
    if (!unreportedTasks) return

    createReport.mutate(
      {
        startDate,
        endDate,
        status: 'draft',
        taskCount: unreportedTasks.length,
        totalHours,
        taskIds: unreportedTasks.map((t) => t.id),
      },
      {
        onSuccess: () => {
          navigate({ to: '/reports/history' })
        },
      },
    )
  }

  // ── Summary cards ────────────────────────────────────────
  function SummaryCards() {
    if (!showPreview) return null

    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-400" size={20} />
            <div>
              <p className="text-2xl font-bold text-zinc-100">
                {isLoadingPreview ? '…' : unreportedTasks?.length ?? 0}
              </p>
              <p className="text-xs text-zinc-400">Total Tasks</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Clock className="text-emerald-400" size={20} />
            <div>
              <p className="text-2xl font-bold text-zinc-100">
                {isLoadingPreview ? '…' : formatDuration(totalHours)}
              </p>
              <p className="text-xs text-zinc-400">Total Hours</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ListTree className="text-amber-400" size={20} />
            <div>
              <p className="text-2xl font-bold text-zinc-100">
                {isLoadingPreview ? '…' : categoryCount}
              </p>
              <p className="text-xs text-zinc-400">Categories</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ── Preview area ─────────────────────────────────────────
  function PreviewArea() {
    if (!showPreview) {
      return (
        <div className="text-center py-16 text-zinc-500">
          <Eye size={40} className="mx-auto mb-3 opacity-50" />
          <p>Select a date range and click Preview to see unreported tasks.</p>
        </div>
      )
    }

    if (isLoadingPreview) {
      return (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading tasks…
        </div>
      )
    }

    if (!unreportedTasks || unreportedTasks.length === 0) {
      return (
        <div className="text-center py-16 text-zinc-500">
          <Calendar size={40} className="mx-auto mb-3 opacity-50" />
          <p>No unreported tasks in this range.</p>
          <p className="text-sm mt-1">
            All tasks created between {formatDate(startDate)} and{' '}
            {formatDate(endDate)} are already reported.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {Array.from(tasksByCategory.entries()).map(([category, tasks]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={category} />
              <span className="text-sm text-zinc-400">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                {' · '}
                {formatDuration(
                  tasks.reduce((s, t) => s + t.estimatedDuration, 0),
                )}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => {
                const firstNote = task.notes[0]
                const notePreview =
                  firstNote && firstNote.content.length > 80
                    ? firstNote.content.slice(0, 80) + '…'
                    : firstNote?.content

                return (
                  <Card key={task.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-100 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={task.category} />
                        <Badge variant={task.status} />
                        <span className="text-xs text-zinc-500">
                          {formatDuration(task.estimatedDuration)}
                        </span>
                      </div>
                      {notePreview && (
                        <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">
                          {notePreview}
                        </p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Report Builder</h1>

      {/* Date range inputs */}
      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setShowPreview(false)
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setShowPreview(false)
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={!startDate || !endDate}
          >
            <Eye size={16} />
            Preview
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      <SummaryCards />

      {/* Preview / results */}
      <PreviewArea />

      {/* Generate Report button */}
      {showPreview && unreportedTasks !== undefined && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div>
            <p className="text-sm text-zinc-300">
              <span className="font-semibold">{unreportedTasks.length}</span>{' '}
              unreported task{unreportedTasks.length !== 1 ? 's' : ''} ·{' '}
              {formatDuration(totalHours)} total
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {unreportedTasks.length === 0
                ? 'No unreported tasks in this range. A blank report will be created.'
                : 'A draft report will be created and tasks will be marked as reported.'}
            </p>
          </div>
          <Button onClick={handleGenerate} isLoading={createReport.isPending}>
            <FileText size={16} />
            Generate Report
          </Button>
        </div>
      )}
    </div>
  )
}
