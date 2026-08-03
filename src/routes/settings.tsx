import { createFileRoute } from '@tanstack/react-router'
import BackupPanel from '../features/backup/components/BackupPanel'

export const Route = createFileRoute('/settings')({
  component: BackupPanel,
})
