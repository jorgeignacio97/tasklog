import { db } from '../../../lib/db'
import { resetDbBeforeEach } from '../../../shared/utils/testDb'
import { ReportServiceImpl } from './report.service.impl'
import { TaskServiceImpl } from '../../tasks/services/task.service.impl'
import type { CreateReportInput } from './report.service'
import type { CreateTaskInput } from '../../tasks/services/task.service'

resetDbBeforeEach()

const reportService = new ReportServiceImpl()
const taskService = new TaskServiceImpl()

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

describe('ReportServiceImpl', () => {
  describe('create + getById (RS-7)', () => {
    it('persists the report so getById immediately returns it', async () => {
      const created = await reportService.create(
        makeReportInput({ totalHours: 5 }),
      )

      const fetched = await reportService.getById(created.id)
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.totalHours).toBe(5)
    })
  })

  describe('getAll (RS-8)', () => {
    it('returns every report created', async () => {
      await reportService.create(
        makeReportInput({ startDate: '2026-01-01', endDate: '2026-01-31' }),
      )
      await reportService.create(
        makeReportInput({ startDate: '2026-02-01', endDate: '2026-02-28' }),
      )
      await reportService.create(
        makeReportInput({ startDate: '2026-03-01', endDate: '2026-03-31' }),
      )

      const all = await reportService.getAll()
      expect(all).toHaveLength(3)
    })
  })

  describe('delete on non-existent id (RS-9)', () => {
    it('resolves without throwing and affects no rows', async () => {
      await expect(reportService.delete('missing-id')).resolves.toBeUndefined()
    })
  })

  describe('delete re-opens linked tasks (RS-1, RS-2)', () => {
    it('RS-1: clears reportedInReportId on tasks linked to the deleted report and removes the report record', async () => {
      const report = await reportService.create(makeReportInput())
      const task = await taskService.create(
        makeTaskInput({ title: 'Linked task', reportedInReportId: report.id }),
      )

      await reportService.delete(report.id)

      expect(await reportService.getById(report.id)).toBeUndefined()

      const row = await db.tasks.get(task.id)
      expect(row).toBeDefined()
      expect('reportedInReportId' in row!).toBe(false)
    })

    it('RS-2: leaves tasks linked to other reports untouched', async () => {
      const report = await reportService.create(makeReportInput())
      await taskService.create(
        makeTaskInput({ title: 'Linked task', reportedInReportId: report.id }),
      )
      const otherReport = await reportService.create(
        makeReportInput({ startDate: '2026-04-01', endDate: '2026-04-30' }),
      )
      const otherTask = await taskService.create(
        makeTaskInput({
          title: 'Other report task',
          reportedInReportId: otherReport.id,
        }),
      )

      await reportService.delete(report.id)

      const untouchedRow = await db.tasks.get(otherTask.id)
      expect(untouchedRow?.reportedInReportId).toBe(otherReport.id)
    })
  })

  describe('getTasksForReport (RS-3, RS-4)', () => {
    it('RS-3: returns exactly the linked tasks, each with its notes joined', async () => {
      const report = await reportService.create(makeReportInput())
      const linked = await taskService.create(
        makeTaskInput({
          title: 'Linked with notes',
          reportedInReportId: report.id,
          notes: [
            {
              id: 'n1',
              content: 'note one',
              createdAt: '2020-01-01T00:00:00.000Z',
            },
          ],
        }),
      )
      await taskService.create(makeTaskInput({ title: 'Not linked' }))

      const result = await reportService.getTasksForReport(report.id)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(linked.id)
      expect(result[0].notes.map((n) => n.content)).toEqual(['note one'])
    })

    it('RS-4: returns [] without throwing when the report has zero linked tasks', async () => {
      const report = await reportService.create(makeReportInput())

      await expect(reportService.getTasksForReport(report.id)).resolves.toEqual(
        [],
      )
    })
  })

  describe('update on non-existent id (RS-5)', () => {
    it('throws rather than silently no-oping', async () => {
      await expect(
        reportService.update('missing-id', { totalHours: 1 }),
      ).rejects.toThrow('Report not found: missing-id')
    })
  })

  describe('update happy path (RS-10)', () => {
    it('persists the new field values and bumps updatedAt', async () => {
      const created = await reportService.create(
        makeReportInput({ status: 'draft', totalHours: 5 }),
      )
      await db.reports.update(created.id, {
        updatedAt: '2020-01-01T00:00:00.000Z',
      })

      const updated = await reportService.update(created.id, {
        status: 'sent',
        totalHours: 8,
      })

      expect(updated.status).toBe('sent')
      expect(updated.totalHours).toBe(8)
      expect(updated.updatedAt > '2020-01-01T00:00:00.000Z').toBe(true)

      const fetched = await reportService.getById(created.id)
      expect(fetched?.status).toBe('sent')
      expect(fetched?.totalHours).toBe(8)
    })
  })

  describe('atomicity (RS-6)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('rolls back task re-opening if report deletion fails', async () => {
      const report = await reportService.create(makeReportInput())
      const task = await taskService.create(
        makeTaskInput({ title: 'Linked task', reportedInReportId: report.id }),
      )

      vi.spyOn(db.reports, 'delete').mockRejectedValueOnce(
        new Error('simulated failure'),
      )

      await expect(reportService.delete(report.id)).rejects.toThrow()

      const row = await db.tasks.get(task.id)
      expect(row?.reportedInReportId).toBe(report.id)
      expect(await reportService.getById(report.id)).toBeDefined()
    })
  })
})
