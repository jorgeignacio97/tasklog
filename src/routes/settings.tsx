import { createFileRoute } from '@tanstack/react-router'
// Direct path, not the feature barrel — see routes/tasks/index.tsx.
import BackupPanel from '../features/backup/components/BackupPanel'

export const Route = createFileRoute('/settings')({
  component: BackupPanel,
})
