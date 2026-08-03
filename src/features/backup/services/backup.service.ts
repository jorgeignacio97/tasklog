import type { BackupData } from '../schemas/backup.schema'

/**
 * Pure async service interface for full-database backup operations.
 *
 * No Dexie types leak into the interface — the consumer is storage-agnostic.
 */
export interface BackupService {
  exportData(): Promise<BackupData>
  importData(data: unknown): Promise<void>
}
