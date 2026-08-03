import { z } from 'zod'

export const reportStatusSchema = z.enum(['draft', 'sent'])

export const reportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
})

export type ReportInput = z.infer<typeof reportSchema>
