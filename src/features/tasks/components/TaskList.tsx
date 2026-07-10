import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { Button } from '../../../shared/components/Button'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import Badge from '../../../shared/components/Badge'
import Modal from '../../../shared/components/Modal'
import { formatDate, formatDuration } from '../../../shared/utils/cn'
import type { Task, TaskCategory, TaskStatus } from '../../../shared/types'

const categoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'bug', label: 'Bug' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pending: 'in-progress',
  'in-progress': 'completed',
  completed: 'completed',
}

// ── Row Actions (needs its own modal state per row) ──────────────────────

function RowActions({ task }: { task: Task }) {
  const [showDelete, setShowDelete] = useState(false)
  const deleteMutation = useDeleteTask()

  return (
    <>
      <div className="flex items-center gap-1">
        <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
          <Button variant="ghost" size="sm" aria-label="Edit task">
            <Pencil size={14} />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDelete(true)}
          aria-label="Delete task"
        >
          <Trash2 size={14} className="text-red-400" />
        </Button>
      </div>
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete task"
      >
        <p className="mb-4 text-sm text-zinc-300">
          Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              deleteMutation.mutate(task.id)
              setShowDelete(false)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

// ── Status cell with inline toggle ──────────────────────────────────────

function StatusCell({ task }: { task: Task }) {
  const updateMutation = useUpdateTask()

  return (
    <button
      type="button"
      onClick={() =>
        updateMutation.mutate({ id: task.id, data: { status: nextStatus[task.status] } })
      }
      className="cursor-pointer transition-opacity hover:opacity-80"
      title={`Current: ${task.status}. Click to cycle.`}
    >
      <Badge variant={task.status} />
    </button>
  )
}

// ── Columns definition ──────────────────────────────────────────────────

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Title
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => (
      <Link
        to="/tasks/$taskId"
        params={{ taskId: info.row.original.id }}
        className="text-indigo-400 transition-colors hover:text-indigo-300"
      >
        {info.getValue() as string}
      </Link>
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Category
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => <Badge variant={info.getValue() as TaskCategory} />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => <StatusCell task={info.row.original} />,
  },
  {
    accessorKey: 'estimatedDuration',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Duration
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => (
      <span className="text-sm text-zinc-400">
        {formatDuration(info.getValue() as number)}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => (
      <span className="text-sm text-zinc-400">
        {formatDate(info.getValue() as string)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: (info) => <RowActions task={info.row.original} />,
  },
]

// ── Skeleton row ────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: columns.length }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
        </td>
      ))}
    </tr>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export default function TaskList() {
  const { data: tasks = [], isLoading } = useTasks()
  const [sorting, setSorting] = useState<SortingState>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (categoryFilter && task.category !== categoryFilter) return false
      if (statusFilter && task.status !== statusFilter) return false
      if (searchText) {
        const q = searchText.toLowerCase()
        return (
          task.title.toLowerCase().includes(q) ||
          (task.description?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [tasks, categoryFilter, statusFilter, searchText])

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const showEmptyState = !isLoading && tasks.length === 0
  const showNoResults = !isLoading && tasks.length > 0 && filteredTasks.length === 0

  return (
    <div className="space-y-4">
      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Category"
            options={categoryOptions.slice(1)}
            placeholder="All categories"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            options={statusOptions.slice(1)}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Input
            label="Search"
            placeholder="Search by title…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Link to="/tasks/new">
          <Button>
            <Plus size={16} />
            New Task
          </Button>
        </Link>
      </div>

      {/* ── Loading state ───────────────────────────────────────────── */}
      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                {columns.map((col) => (
                  <th key={col.id ?? (col as { accessorKey?: string }).accessorKey} className="px-4 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {showEmptyState && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-lg text-zinc-400">No tasks yet</p>
          <Link to="/tasks/new">
            <Button>
              <Plus size={16} />
              Create your first task
            </Button>
          </Link>
        </div>
      )}

      {/* ── No results state ────────────────────────────────────────── */}
      {showNoResults && (
        <div className="py-16 text-center">
          <p className="text-lg text-zinc-400">No tasks match your filters</p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('')
              setStatusFilter('')
              setSearchText('')
            }}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {!isLoading && filteredTasks.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-zinc-800 bg-zinc-900">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
