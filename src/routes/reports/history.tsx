import { createFileRoute } from '@tanstack/react-router'
import ReportHistory from '../../features/reports/components/ReportHistory'

export const Route = createFileRoute('/reports/history')({
  component: ReportHistory,
})
