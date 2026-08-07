import { createFileRoute } from '@tanstack/react-router'
// Direct path, not the feature barrel — see routes/tasks/index.tsx.
import ReportHistory from '../../features/reports/components/ReportHistory'

export const Route = createFileRoute('/reports/history')({
  component: ReportHistory,
})
