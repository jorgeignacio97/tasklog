import { z } from 'zod'

export const taskCategorySchema = z.enum([
  'frontend',
  'backend',
  'bug',
  'review',
  'other',
])

export const taskStatusSchema = z.enum(['pendiente', 'en-curso', 'completada'])

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: taskCategorySchema,
  status: taskStatusSchema,
  estimatedDuration: z.number().min(0),
})

export type TaskInput = z.infer<typeof taskSchema>
