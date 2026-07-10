import type { Report, Task } from '../../../shared/types';

export type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateReportInput = Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Pure async service interface for report operations.
 *
 * No Dexie types leak into the interface — the consumer is storage-agnostic.
 */
export interface ReportService {
  getAll(): Promise<Report[]>;
  getById(id: string): Promise<Report | undefined>;
  create(data: CreateReportInput): Promise<Report>;
  update(id: string, data: UpdateReportInput): Promise<Report>;
  delete(id: string): Promise<void>;
  getTasksForReport(reportId: string): Promise<Task[]>;
}
