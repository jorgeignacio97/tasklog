import { db } from '../../../lib/db'
import type { Report, Task } from '../../../shared/types'
import type {
  ReportService,
  CreateReportInput,
  UpdateReportInput,
} from './report.service'

export class ReportServiceImpl implements ReportService {
  async getAll(): Promise<Report[]> {
    return db.reports.toArray()
  }

  async getById(id: string): Promise<Report | undefined> {
    return db.reports.get(id)
  }

  async create(data: CreateReportInput): Promise<Report> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const report: Report = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    }

    await db.reports.add(report)
    return report
  }

  async update(id: string, data: UpdateReportInput): Promise<Report> {
    const now = new Date().toISOString()

    await db.transaction('rw', db.reports, async () => {
      const existing = await db.reports.get(id)
      if (!existing) {
        throw new Error(`Report not found: ${id}`)
      }

      await db.reports.update(id, { ...data, updatedAt: now })
    })

    const updated = await db.reports.get(id)
    if (!updated) {
      throw new Error(`Report not found after update: ${id}`)
    }

    return updated
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.reports, db.tasks, async () => {
      // Re-open tasks that were linked to this report
      await db.tasks
        .where('reportedInReportId')
        .equals(id)
        .modify({
          reportedInReportId: undefined,
          updatedAt: new Date().toISOString(),
        })

      await db.reports.delete(id)
    })
  }

  async getTasksForReport(reportId: string): Promise<Task[]> {
    const taskEntities = await db.tasks
      .where('reportedInReportId')
      .equals(reportId)
      .toArray()

    const notesByTask = new Map<string, Task['notes']>()
    const allNotes = await db.taskNotes
      .where('taskId')
      .anyOf(taskEntities.map((t) => t.id))
      .toArray()

    for (const note of allNotes) {
      const existing = notesByTask.get(note.taskId) ?? []
      existing.push({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
      })
      notesByTask.set(note.taskId, existing)
    }

    return taskEntities.map((entity) => ({
      ...entity,
      notes: notesByTask.get(entity.id) ?? [],
    }))
  }
}
