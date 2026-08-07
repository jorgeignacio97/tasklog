import { createFileRoute } from '@tanstack/react-router'
// Direct paths, not the feature barrel — see routes/tasks/index.tsx.
import ReportBuilder from '../../features/reports/components/ReportBuilder'
import { reportBuilderSearchSchema } from '../../features/reports/schemas/report.schema'

export const Route = createFileRoute('/reports/')({
  component: ReportBuilder,
  validateSearch: reportBuilderSearchSchema,
})
