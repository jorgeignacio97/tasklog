import Dexie, { type EntityTable } from 'dexie'
import { toast } from 'sonner'
import type { Task, Report } from '../shared/types'

export type TaskNoteDexie = {
  id: string
  taskId: string
  content: string
  createdAt: string
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
  tasks!: EntityTable<Omit<Task, 'notes'>, 'id'>
  reports!: EntityTable<Report, 'id'>
  taskNotes!: EntityTable<TaskNoteDexie, 'id'>

  constructor() {
    super('TaskLogDB')

    this.version(1).stores({
      tasks: 'id, [category+status], createdAt, reportedInReportId',
      reports: 'id, createdAt',
      taskNotes: 'id, taskId',
    })

    // Another tab is on an older DB version and is blocking a version
    // upgrade in this tab — nothing opens until that tab closes/reloads.
    this.on('blocked', () => {
      toast.warning('TaskLog está abierto en otra pestaña', {
        description:
          'Cerrá las otras pestañas de TaskLog para poder actualizar los datos aquí.',
        duration: Infinity,
      })
    })

    // This tab is on the old version and another tab just upgraded the
    // schema — our open connection is now stale and must be closed so the
    // other tab's upgrade can proceed; reloading here reconnects clean.
    this.on('versionchange', () => {
      this.close()
      toast('TaskLog se actualizó en otra pestaña', {
        description: 'Recargá esta pestaña para seguir usándola.',
        duration: Infinity,
      })
    })
  }
}

export const db = new TaskLogDB()
