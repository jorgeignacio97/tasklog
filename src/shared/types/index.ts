export type TaskCategory = 'frontend' | 'backend' | 'bug' | 'review' | 'other'

export type TaskStatus = 'pendiente' | 'en-curso' | 'completada'

export type ReportStatus = 'draft' | 'sent'

export interface Note {
  id: string
  content: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  status: TaskStatus
  estimatedDuration: number
  notes: Note[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  reportedInReportId?: string
}

export interface Report {
  id: string
  startDate: string
  endDate: string
  description?: string
  status: ReportStatus
  sentAt?: string
  taskCount: number
  totalHours: number
  createdAt: string
  updatedAt: string
}
