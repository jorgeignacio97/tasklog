import type { z } from 'zod'
import {
  taskCategorySchema,
  taskStatusSchema,
  reportStatusSchema,
} from '../schemas/enums'

export type TaskCategory = z.infer<typeof taskCategorySchema>

export type TaskStatus = z.infer<typeof taskStatusSchema>

export type ReportStatus = z.infer<typeof reportStatusSchema>

export type Note = {
  id: string
  content: string
  createdAt: string
}

export type Task = {
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

export type Report = {
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
