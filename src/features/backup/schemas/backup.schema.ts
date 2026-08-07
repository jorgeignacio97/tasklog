import { z } from 'zod'
// Direct paths, not the tasks/reports barrels — see backup.service.impl.ts
// for why (avoids a circular ESM import through lib/services.ts).
import {
  taskCategorySchema,
  taskStatusSchema,
  TITLE_MAX_LENGTH,
} from '../../tasks/schemas/task.schema'
import { reportStatusSchema } from '../../reports/schemas/report.schema'

const noteSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
})

const taskDataSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().optional(),
  category: taskCategorySchema,
  status: taskStatusSchema,
  estimatedDuration: z.number().min(0),
  notes: z.array(noteSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  reportedInReportId: z.string().optional(),
})

const reportDataSchema = z.object({
  id: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  description: z.string().optional(),
  status: reportStatusSchema,
  sentAt: z.string().datetime().optional(),
  taskCount: z.number().int().min(0),
  totalHours: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const backupDataSchema = z
  .object({
    version: z.literal(1),
    exportedAt: z.string().datetime(),
    tasks: z.array(taskDataSchema),
    reports: z.array(reportDataSchema),
  })
  .superRefine((data, ctx) => {
    const taskIds = new Set<string>()
    for (const task of data.tasks) {
      if (taskIds.has(task.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate task id: ${task.id}`,
          path: ['tasks'],
        })
      }
      taskIds.add(task.id)
    }

    const noteIds = new Set<string>()
    for (const task of data.tasks) {
      for (const note of task.notes) {
        if (noteIds.has(note.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate note id: ${note.id}`,
            path: ['tasks'],
          })
        }
        noteIds.add(note.id)
      }
    }

    const reportIds = new Set<string>()
    for (const report of data.reports) {
      if (reportIds.has(report.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate report id: ${report.id}`,
          path: ['reports'],
        })
      }
      reportIds.add(report.id)
    }
  })

export type BackupData = z.infer<typeof backupDataSchema>
