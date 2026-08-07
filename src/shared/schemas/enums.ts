import { z } from 'zod'

export const taskCategorySchema = z.enum([
  'frontend',
  'backend',
  'bug',
  'review',
  'other',
])

export const taskStatusSchema = z.enum(['pendiente', 'en-curso', 'completada'])

export const reportStatusSchema = z.enum(['draft', 'sent'])
