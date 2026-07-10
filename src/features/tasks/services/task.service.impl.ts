import { db } from '../../../lib/db';
import type { Task, TaskCategory, Note } from '../../../shared/types';
import type { TaskService, CreateTaskInput, UpdateTaskInput } from './task.service';

export class TaskServiceImpl implements TaskService {
  async getAll(): Promise<Task[]> {
    const entities = await db.tasks.toArray();
    return this.attachNotesToAll(entities);
  }

  async getById(id: string): Promise<Task | undefined> {
    const entity = await db.tasks.get(id);
    if (!entity) return undefined;
    return this.attachNotes(entity);
  }

  async create(data: CreateTaskInput): Promise<Task> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { notes, ...rest } = data;

    await db.tasks.add({
      ...rest,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: data.completedAt ?? undefined,
      reportedInReportId: data.reportedInReportId ?? undefined,
    });

    const noteEntities = notes.map((n) => ({
      id: crypto.randomUUID(),
      taskId: id,
      content: n.content,
      createdAt: n.createdAt ?? now,
    }));

    if (noteEntities.length > 0) {
      await db.taskNotes.bulkAdd(noteEntities);
    }

    return {
      ...rest,
      id,
      notes: noteEntities.map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
      })),
      createdAt: now,
      updatedAt: now,
      completedAt: data.completedAt ?? undefined,
      reportedInReportId: data.reportedInReportId ?? undefined,
    };
  }

  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    const now = new Date().toISOString();
    const { notes, ...fields } = data;

    const updates: Record<string, unknown> = {
      ...fields,
      updatedAt: now,
    };

    await db.tasks.update(id, updates);

    if (notes !== undefined) {
      await db.taskNotes.where('taskId').equals(id).delete();

      if (notes.length > 0) {
        const noteEntities = notes.map((n) => ({
          id: crypto.randomUUID(),
          taskId: id,
          content: n.content,
          createdAt: n.createdAt ?? now,
        }));
        await db.taskNotes.bulkAdd(noteEntities);
      }
    }

    const updated = await db.tasks.get(id);
    if (!updated) {
      throw new Error(`Task not found after update: ${id}`);
    }

    return this.attachNotes(updated);
  }

  async delete(id: string): Promise<void> {
    await db.taskNotes.where('taskId').equals(id).delete();
    await db.tasks.delete(id);
  }

  async getByCategory(category: TaskCategory): Promise<Task[]> {
    const entities = await db.tasks.where('category').equals(category).toArray();
    return this.attachNotesToAll(entities);
  }

  async getUnreportedInRange(start: string, end: string): Promise<Task[]> {
    const entities = await db.tasks
      .filter(
        (t) =>
          !t.reportedInReportId &&
          t.createdAt >= start &&
          t.createdAt <= end,
      )
      .toArray();
    return this.attachNotesToAll(entities);
  }

  // ── Private helpers ──────────────────────────────────────────

  private async attachNotes(
    entity: Omit<Task, 'notes'>,
  ): Promise<Task> {
    const notes = await db.taskNotes
      .where('taskId')
      .equals(entity.id)
      .toArray();
    return {
      ...entity,
      notes: notes.map(toNote),
    };
  }

  private async attachNotesToAll(
    entities: Omit<Task, 'notes'>[],
  ): Promise<Task[]> {
    if (entities.length === 0) return [];
    return Promise.all(entities.map((e) => this.attachNotes(e)));
  }
}

function toNote(tn: { id: string; content: string; createdAt: string }): Note {
  return { id: tn.id, content: tn.content, createdAt: tn.createdAt };
}

export const taskService = new TaskServiceImpl();
