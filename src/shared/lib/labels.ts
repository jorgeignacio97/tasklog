import type { TaskCategory, TaskStatus, ReportStatus } from '../types'

interface SelectOption {
  value: string
  label: string
}

export const categoryLabels: Record<TaskCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  bug: 'Bug',
  review: 'Review',
  other: 'Otro',
}

export const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  'in-progress': 'En curso',
  completed: 'Completada',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
}

export const categoryOptions: SelectOption[] = [
  { value: 'frontend', label: categoryLabels.frontend },
  { value: 'backend', label: categoryLabels.backend },
  { value: 'bug', label: categoryLabels.bug },
  { value: 'review', label: categoryLabels.review },
  { value: 'other', label: categoryLabels.other },
]

export const statusOptions: SelectOption[] = [
  { value: 'pending', label: statusLabels.pending },
  { value: 'in-progress', label: statusLabels['in-progress'] },
  { value: 'completed', label: statusLabels.completed },
]

export const categoryFilterOptions: SelectOption[] = [
  { value: '', label: 'Todas las categorías' },
  ...categoryOptions,
]

export const statusFilterOptions: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  ...statusOptions,
]

export const badgeLabels: Record<TaskCategory | TaskStatus | ReportStatus, string> = {
  ...categoryLabels,
  ...statusLabels,
  ...reportStatusLabels,
}
