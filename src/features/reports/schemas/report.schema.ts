import { z } from 'zod'
import { reportStatusSchema } from '../../../shared/schemas/enums'

export { reportStatusSchema }

export const reportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
})

export type ReportInput = z.infer<typeof reportSchema>

export const reportBuilderSearchSchema = z.object({
  startDate: z.string().optional().catch(undefined),
  endDate: z.string().optional().catch(undefined),
})

export type ReportBuilderSearch = z.infer<typeof reportBuilderSearchSchema>
