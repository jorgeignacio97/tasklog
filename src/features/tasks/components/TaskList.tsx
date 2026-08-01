import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import { Plus, ArrowUpDown } from 'lucide-react'
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { Button } from '../../../shared/components/Button'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import Badge from '../../../shared/components/Badge'
import Modal from '../../../shared/components/Modal'
import { TaskRowActions } from './TaskRowActions'
import { TaskStatusCell } from './TaskStatusCell'
import { formatDate, formatDuration } from '../../../shared/utils/cn'
import type { Task, TaskCategory, TaskStatus } from '../../../shared/types'
import {
  categoryFilterOptions,
  statusFilterOptions,
} from '../../../shared/lib/labels'

const nextStatus: Record<TaskStatus, TaskStatus> = {
  pendiente: 'en-curso',
  'en-curso': 'completada',
  completada: 'completada',
}

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onToggleStatus: (task: TData) => void
    onDeleteClick: (task: TData) => void
  }
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
        Título
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
        Categoría
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
        Estado
        <ArrowUpDown size={14} />
      </button>
    ),
    cell: (info) => (
      <TaskStatusCell
        task={info.row.original}
        onToggle={info.table.options.meta!.onToggleStatus}
      />
    ),
  },
  {
    accessorKey: 'estimatedDuration',
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-zinc-300 hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Duración
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
        Creada
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
    cell: (info) => (
      <TaskRowActions
        task={info.row.original}
        onDeleteClick={info.table.options.meta!.onDeleteClick}
      />
    ),
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
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()
  const [sorting, setSorting] = useState<SortingState>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
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
      }),
    [tasks, categoryFilter, statusFilter, searchText],
  )

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (task) => task.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      onToggleStatus: (task: Task) =>
        updateMutation.mutate({
          id: task.id,
          data: { status: nextStatus[task.status] },
        }),
      onDeleteClick: (task: Task) => setDeleteTarget(task),
    },
  })

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const showEmptyState = !isLoading && tasks.length === 0
  const showNoResults =
    !isLoading && tasks.length > 0 && filteredTasks.length === 0

  return (
    <div className="space-y-4">
      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Categoría"
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            label="Estado"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Input
            label="Buscar"
            placeholder="Buscar por título…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Link to="/tasks/new">
          <Button>
            <Plus size={16} />
            Nueva tarea
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
                  <th
                    key={
                      col.id ?? (col as { accessorKey?: string }).accessorKey
                    }
                    className="px-4 py-3"
                  >
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
          <p className="text-lg text-zinc-400">Todavía no hay tareas</p>
          <Link to="/tasks/new">
            <Button>
              <Plus size={16} />
              Crear tu primera tarea
            </Button>
          </Link>
        </div>
      )}

      {/* ── No results state ────────────────────────────────────────── */}
      {showNoResults && (
        <div className="py-16 text-center">
          <p className="text-lg text-zinc-400">
            No hay tareas que coincidan con los filtros
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('')
              setStatusFilter('')
              setSearchText('')
            }}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {!isLoading && filteredTasks.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-zinc-800 bg-zinc-900"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete confirmation modal (single, shared across all rows) ──── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar tarea"
      >
        <p className="mb-4 text-sm text-zinc-300">
          ¿Estás seguro de que deseas eliminar &ldquo;{deleteTarget?.title}
          &rdquo;? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
            isLoading={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
