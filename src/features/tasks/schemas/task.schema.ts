import { z } from 'zod'
import { taskCategorySchema, taskStatusSchema } from '../../../shared/schemas/enums'

export { taskCategorySchema, taskStatusSchema }

export const TITLE_MAX_LENGTH = 200

export const taskSchema = z.object({
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().optional(),
  category: taskCategorySchema,
  status: taskStatusSchema,
  estimatedDuration: z.number().min(0),
})

export type TaskInput = z.infer<typeof taskSchema>

export const taskListSearchSchema = z.object({
  category: taskCategorySchema.optional().catch(undefined),
  status: taskStatusSchema.optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type TaskListSearch = z.infer<typeof taskListSearchSchema>
