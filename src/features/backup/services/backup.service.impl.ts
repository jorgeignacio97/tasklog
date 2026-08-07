import { db } from '../../../lib/db'
// Direct paths, not the tasks/reports barrels: those barrels also export UI
// components whose hooks import lib/services.ts, which constructs THIS
// class — routing through the barrel here would be a circular ESM import.
import { TaskServiceImpl } from '../../tasks/services/task.service.impl'
import { ReportServiceImpl } from '../../reports/services/report.service.impl'
import { backupDataSchema, type BackupData } from '../schemas/backup.schema'
import type { BackupService } from './backup.service'

const taskService = new TaskServiceImpl()
const reportService = new ReportServiceImpl()

export class BackupServiceImpl implements BackupService {
  async exportData(): Promise<BackupData> {
    const [tasks, reports] = await Promise.all([
      taskService.getAll(),
      reportService.getAll(),
    ])

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      reports,
    }
  }

  async importData(data: unknown): Promise<void> {
    const parsed = backupDataSchema.parse(data)

    await db.transaction('rw', db.tasks, db.reports, db.taskNotes, async () => {
      await Promise.all([
        db.tasks.clear(),
        db.reports.clear(),
        db.taskNotes.clear(),
      ])

      const taskRows = parsed.tasks.map(({ notes: _notes, ...rest }) => rest)
      const noteRows = parsed.tasks.flatMap((task) =>
        task.notes.map((note) => ({
          id: note.id,
          taskId: task.id,
          content: note.content,
          createdAt: note.createdAt,
        })),
      )

      if (taskRows.length > 0) {
        await db.tasks.bulkAdd(taskRows)
      }
      if (noteRows.length > 0) {
        await db.taskNotes.bulkAdd(noteRows)
      }
      if (parsed.reports.length > 0) {
        await db.reports.bulkAdd(parsed.reports)
      }
    })
  }
}
