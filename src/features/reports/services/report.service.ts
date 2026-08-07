import type { Report, Task } from '../../../shared/types'

export type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateReportInput = Partial<
  Omit<Report, 'id' | 'createdAt' | 'updatedAt'>
>

/**
 * Pure async service interface for report operations.
 *
 * No Dexie types leak into the interface — the consumer is storage-agnostic.
 */
export type ReportService = {
  getAll(): Promise<Report[]>
  getById(id: string): Promise<Report | undefined>
  create(data: CreateReportInput): Promise<Report>
  /**
   * Creates the report and links every given task to it in a single Dexie
   * transaction — either all writes commit or none do. A missing taskId
   * rolls back the whole batch instead of leaving an orphan report.
   */
  createWithTaskLinks(
    data: CreateReportInput,
    taskIds: string[],
  ): Promise<Report>
  update(id: string, data: UpdateReportInput): Promise<Report>
  delete(id: string): Promise<void>
  getTasksForReport(reportId: string): Promise<Task[]>
}
