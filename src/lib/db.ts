import Dexie, { type EntityTable } from 'dexie';
import type { Task, Report } from '../shared/types';

export interface TaskNoteDexie {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
}

/**
 * Dexie database for TaskLog.
 *
 * `tasks` stores the raw Task entity without the `notes` array
 * (notes live in the separate `taskNotes` table, keyed by `taskId`).
 * `reports` stores the full Report entity.
 * `taskNotes` stores individual note rows linked to their parent task.
 */
export class TaskLogDB extends Dexie {
  tasks!: EntityTable<Omit<Task, 'notes'>, 'id'>;
  reports!: EntityTable<Report, 'id'>;
  taskNotes!: EntityTable<TaskNoteDexie, 'id'>;

  constructor() {
    super('TaskLogDB');

    this.version(1).stores({
      tasks: 'id, [category+status], createdAt, reportedInReportId',
      reports: 'id, createdAt',
      taskNotes: 'id, taskId',
    });
  }
}

export const db = new TaskLogDB();
