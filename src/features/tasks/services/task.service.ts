import type { Task, TaskCategory } from '../../../shared/types';

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Pure async service interface for task operations.
 *
 * No Dexie types leak into the interface — the consumer is storage-agnostic.
 */
export interface TaskService {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  create(data: CreateTaskInput): Promise<Task>;
  update(id: string, data: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  getByCategory(category: TaskCategory): Promise<Task[]>;
  getUnreportedInRange(start: string, end: string): Promise<Task[]>;
}
