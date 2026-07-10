import { createFileRoute } from '@tanstack/react-router'
import ReportBuilder from '../../features/reports/components/ReportBuilder'

export const Route = createFileRoute('/reports/')({
  component: ReportBuilder,
})
