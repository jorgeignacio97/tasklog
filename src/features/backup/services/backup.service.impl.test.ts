import { db } from '../../../lib/db'
import { resetDbBeforeEach } from '../../../shared/utils/testDb'
import { BackupServiceImpl } from './backup.service.impl'
import { TaskServiceImpl } from '../../tasks/services/task.service.impl'
import { ReportServiceImpl } from '../../reports/services/report.service.impl'
import type { CreateTaskInput } from '../../tasks/services/task.service'
import type { CreateReportInput } from '../../reports/services/report.service'
import type { BackupData } from '../schemas/backup.schema'

resetDbBeforeEach()

const backupService = new BackupServiceImpl()
const taskService = new TaskServiceImpl()
const reportService = new ReportServiceImpl()

function makeTaskInput(
  overrides: Partial<CreateTaskInput> = {},
): CreateTaskInput {
  return {
    title: 'Sample task',
    category: 'frontend',
    status: 'pendiente',
    estimatedDuration: 1,
    notes: [],
    ...overrides,
  }
}

function makeReportInput(
  overrides: Partial<CreateReportInput> = {},
): CreateReportInput {
  return {
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'draft',
    taskCount: 0,
    totalHours: 0,
    ...overrides,
  }
}

function makeBackup(overrides: Partial<BackupData> = {}): BackupData {
  return {
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    tasks: [],
    reports: [],
    ...overrides,
  }
}

describe('BackupServiceImpl', () => {
  describe('exportData (BK-1)', () => {
    it('returns every task (with its notes) and every report in the documented shape', async () => {
      const task = await taskService.create(
        makeTaskInput({
          title: 'With notes',
          notes: [
            {
              id: 'n1',
              content: 'a note',
              createdAt: '2020-01-01T00:00:00.000Z',
            },
          ],
        }),
      )
      const report = await reportService.create(
        makeReportInput({ totalHours: 5 }),
      )

      const exported = await backupService.exportData()

      expect(exported.version).toBe(1)
      expect(typeof exported.exportedAt).toBe('string')

      expect(exported.tasks).toHaveLength(1)
      expect(exported.tasks[0].id).toBe(task.id)
      expect(exported.tasks[0].notes.map((n) => n.content)).toEqual(['a note'])

      expect(exported.reports).toHaveLength(1)
      expect(exported.reports[0].id).toBe(report.id)
      expect(exported.reports[0].totalHours).toBe(5)
    })

    it('returns empty arrays when there is no data', async () => {
      const exported = await backupService.exportData()
      expect(exported.tasks).toEqual([])
      expect(exported.reports).toEqual([])
    })
  })

  describe('importData replaces existing data (BK-2)', () => {
    it('clears prior rows and persists the imported rows with original ids/timestamps preserved', async () => {
      await taskService.create(makeTaskInput({ title: 'Old task' }))
      await reportService.create(makeReportInput())

      const backup = makeBackup({
        tasks: [
          {
            id: 'imported-task-1',
            title: 'Imported task',
            category: 'backend',
            status: 'completada',
            estimatedDuration: 3,
            notes: [
              {
                id: 'imported-note-1',
                content: 'imported note',
                createdAt: '2025-06-01T00:00:00.000Z',
              },
            ],
            createdAt: '2025-06-01T00:00:00.000Z',
            updatedAt: '2025-06-02T00:00:00.000Z',
          },
        ],
        reports: [
          {
            id: 'imported-report-1',
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            status: 'sent',
            taskCount: 1,
            totalHours: 3,
            createdAt: '2025-06-01T00:00:00.000Z',
            updatedAt: '2025-06-02T00:00:00.000Z',
          },
        ],
      })

      await backupService.importData(backup)

      const allTasks = await taskService.getAll()
      expect(allTasks).toHaveLength(1)
      expect(allTasks[0]).toMatchObject({
        id: 'imported-task-1',
        title: 'Imported task',
        createdAt: '2025-06-01T00:00:00.000Z',
        updatedAt: '2025-06-02T00:00:00.000Z',
      })
      expect(allTasks[0].notes).toEqual([
        {
          id: 'imported-note-1',
          content: 'imported note',
          createdAt: '2025-06-01T00:00:00.000Z',
        },
      ])

      const allReports = await reportService.getAll()
      expect(allReports).toHaveLength(1)
      expect(allReports[0]).toMatchObject({
        id: 'imported-report-1',
        status: 'sent',
        createdAt: '2025-06-01T00:00:00.000Z',
      })
    })
  })

  describe('importData rejects malformed payloads (BK-3)', () => {
    it('throws and leaves existing data untouched when `tasks` is missing', async () => {
      await taskService.create(makeTaskInput({ title: 'Untouched task' }))

      await expect(
        backupService.importData({ version: 1, exportedAt: 'x', reports: [] }),
      ).rejects.toThrow()

      const allTasks = await taskService.getAll()
      expect(allTasks).toHaveLength(1)
      expect(allTasks[0].title).toBe('Untouched task')
    })

    it('throws and leaves existing data untouched when `version` does not match', async () => {
      await taskService.create(makeTaskInput({ title: 'Untouched task' }))

      await expect(
        backupService.importData(makeBackup({ version: 2 as unknown as 1 })),
      ).rejects.toThrow()

      const allTasks = await taskService.getAll()
      expect(allTasks).toHaveLength(1)
    })

    it('rejects a task with an empty title', async () => {
      await expect(
        backupService.importData(
          makeBackup({
            tasks: [
              {
                id: 't1',
                title: '',
                category: 'frontend',
                status: 'pendiente',
                estimatedDuration: 1,
                notes: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        ),
      ).rejects.toThrow()
    })

    it('rejects a task with a negative estimatedDuration', async () => {
      await expect(
        backupService.importData(
          makeBackup({
            tasks: [
              {
                id: 't1',
                title: 'Valid title',
                category: 'frontend',
                status: 'pendiente',
                estimatedDuration: -1,
                notes: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        ),
      ).rejects.toThrow()
    })

    it('rejects duplicate task ids', async () => {
      const duplicateTask = {
        id: 'dup-1',
        title: 'Valid title',
        category: 'frontend' as const,
        status: 'pendiente' as const,
        estimatedDuration: 1,
        notes: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }

      await expect(
        backupService.importData(
          makeBackup({ tasks: [duplicateTask, duplicateTask] }),
        ),
      ).rejects.toThrow()
    })
  })

  describe('importData rolls back on a DB-layer failure (BK-4)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('leaves prior data untouched when bulkAdd fails after the tables were cleared', async () => {
      await taskService.create(makeTaskInput({ title: 'Pre-existing task' }))
      await reportService.create(makeReportInput({ totalHours: 2 }))

      vi.spyOn(db.tasks, 'bulkAdd').mockRejectedValueOnce(
        new Error('simulated bulkAdd failure'),
      )

      const backup = makeBackup({
        tasks: [
          {
            id: 'imported-task-1',
            title: 'Imported task',
            category: 'backend',
            status: 'completada',
            estimatedDuration: 3,
            notes: [],
            createdAt: '2025-06-01T00:00:00.000Z',
            updatedAt: '2025-06-02T00:00:00.000Z',
          },
        ],
      })

      await expect(backupService.importData(backup)).rejects.toThrow()

      const allTasks = await taskService.getAll()
      expect(allTasks).toHaveLength(1)
      expect(allTasks[0].title).toBe('Pre-existing task')

      const allReports = await reportService.getAll()
      expect(allReports).toHaveLength(1)
      expect(allReports[0].totalHours).toBe(2)
    })
  })
})
