import { db } from '../../../lib/db'
import { resetDbBeforeEach } from '../../../shared/utils/testDb'
import { TaskServiceImpl } from './task.service.impl'
import type { CreateTaskInput } from './task.service'
import type { Task } from '../../../shared/types'

resetDbBeforeEach()

const service = new TaskServiceImpl()

function makeTaskInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    title: 'Sample task',
    category: 'frontend',
    status: 'pendiente',
    estimatedDuration: 1,
    notes: [],
    ...overrides,
  }
}

function taskRow(overrides: {
  id: string
  createdAt: string
  reportedInReportId?: string
}): Omit<Task, 'notes'> {
  return {
    id: overrides.id,
    title: 'Seeded task',
    category: 'frontend',
    status: 'pendiente',
    estimatedDuration: 1,
    createdAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
    ...(overrides.reportedInReportId !== undefined
      ? { reportedInReportId: overrides.reportedInReportId }
      : {}),
  }
}

describe('TaskServiceImpl', () => {
  describe('getByCategory canary (D2)', () => {
    it('resolves without throwing a SchemaError for a single-field category query', async () => {
      await expect(service.getByCategory('bug')).resolves.toEqual([])
    })

    it('returns a row that only declares the compound [category+status] index, no dedicated single-field index', async () => {
      await service.create(makeTaskInput({ title: 'Bug task', category: 'bug' }))
      const result = await service.getByCategory('bug')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Bug task')
    })
  })

  describe('create + getAll (TS-1, TS-9)', () => {
    it('TS-1: persists task and notes so getById immediately returns both', async () => {
      const created = await service.create(
        makeTaskInput({
          title: 'With notes',
          notes: [
            { id: 'unused-1', content: 'first note', createdAt: '2020-01-01T00:00:00.000Z' },
            { id: 'unused-2', content: 'second note', createdAt: '2020-01-01T00:00:00.000Z' },
          ],
        }),
      )

      expect(created.notes.map((n) => n.content).sort()).toEqual(['first note', 'second note'])

      const fetched = await service.getById(created.id)
      expect(fetched?.notes.map((n) => n.content).sort()).toEqual(['first note', 'second note'])
    })

    it('TS-9: getAll returns every task, each with its own notes, no cross-task leakage', async () => {
      const taskA = await service.create(
        makeTaskInput({
          title: 'Task A',
          notes: [{ id: 'x', content: 'note A', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      )
      const taskB = await service.create(
        makeTaskInput({
          title: 'Task B',
          notes: [{ id: 'y', content: 'note B', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      )

      const all = await service.getAll()
      expect(all).toHaveLength(2)

      const foundA = all.find((t) => t.id === taskA.id)
      const foundB = all.find((t) => t.id === taskB.id)

      expect(foundA?.notes.map((n) => n.content)).toEqual(['note A'])
      expect(foundB?.notes.map((n) => n.content)).toEqual(['note B'])
    })
  })

  describe('update note-replace semantics (TS-2)', () => {
    it('replaces the full note set with a new notes array', async () => {
      const created = await service.create(
        makeTaskInput({
          notes: [
            { id: 'a', content: 'note 1', createdAt: '2020-01-01T00:00:00.000Z' },
            { id: 'b', content: 'note 2', createdAt: '2020-01-01T00:00:00.000Z' },
          ],
        }),
      )

      const updated = await service.update(created.id, {
        notes: [{ id: 'c', content: 'replacement', createdAt: '2020-01-01T00:00:00.000Z' }],
      })

      expect(updated.notes).toHaveLength(1)
      expect(updated.notes[0].content).toBe('replacement')
    })

    it('leaves existing notes untouched when notes is undefined', async () => {
      await service.create(
        makeTaskInput({ notes: [{ id: 'a', content: 'keep me', createdAt: '2020-01-01T00:00:00.000Z' }] }),
      )
      const created = await service.getAll().then((all) => all[0])

      const updated = await service.update(created.id, { title: 'renamed only' })

      expect(updated.title).toBe('renamed only')
      expect(updated.notes.map((n) => n.content)).toEqual(['keep me'])
    })

    it('clears all notes when notes is an empty array', async () => {
      const created = await service.create(
        makeTaskInput({ notes: [{ id: 'a', content: 'to be cleared', createdAt: '2020-01-01T00:00:00.000Z' }] }),
      )

      const updated = await service.update(created.id, { notes: [] })

      expect(updated.notes).toEqual([])
    })
  })

  describe('delete cascade (TS-3)', () => {
    it('deletes the task and all of its notes, leaving another task intact', async () => {
      const toDelete = await service.create(
        makeTaskInput({ notes: [{ id: 'a', content: 'gone', createdAt: '2020-01-01T00:00:00.000Z' }] }),
      )
      const untouched = await service.create(
        makeTaskInput({
          title: 'keep',
          notes: [{ id: 'b', content: 'stays', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      )

      await service.delete(toDelete.id)

      expect(await service.getById(toDelete.id)).toBeUndefined()
      const remainingNotes = await db.taskNotes.where('taskId').equals(toDelete.id).toArray()
      expect(remainingNotes).toEqual([])

      const other = await service.getById(untouched.id)
      expect(other?.notes.map((n) => n.content)).toEqual(['stays'])
    })
  })

  describe('getByCategory filter (TS-4)', () => {
    it('returns only tasks matching the requested category', async () => {
      await service.create(makeTaskInput({ title: 'Bug 1', category: 'bug' }))
      await service.create(makeTaskInput({ title: 'FE 1', category: 'frontend' }))

      const bugs = await service.getByCategory('bug')
      expect(bugs.map((t) => t.title)).toEqual(['Bug 1'])
    })
  })

  describe('update on non-existent id (TS-7)', () => {
    it('throws rather than silently no-oping', async () => {
      await expect(service.update('missing-id', { title: 'x' })).rejects.toThrow(
        'Task not found: missing-id',
      )
    })
  })

  describe('delete on non-existent id (TS-10)', () => {
    it('resolves without throwing and affects no rows', async () => {
      await expect(service.delete('missing-id')).resolves.toBeUndefined()
    })
  })

  describe('getUnreportedInRange (TS-5, TS-6 Buenos Aires baseline)', () => {
    it('TS-5: returns only unreported tasks whose calendar day falls within the range', async () => {
      await db.tasks.bulkAdd([
        taskRow({ id: 't-in-range', createdAt: '2026-03-15T15:00:00.000Z' }),
        taskRow({ id: 't-out-of-range', createdAt: '2026-04-01T15:00:00.000Z' }),
        taskRow({
          id: 't-already-reported',
          createdAt: '2026-03-15T15:00:00.000Z',
          reportedInReportId: 'r-1',
        }),
      ])

      const result = await service.getUnreportedInRange('2026-03-01', '2026-03-31')

      expect(result.map((t) => t.id)).toEqual(['t-in-range'])
    })

    it('TS-6: a UTC-offset boundary timestamp resolves to the previous local day', async () => {
      // 2026-03-15T02:00:00Z is 2026-03-14 23:00 local (UTC-3, Buenos Aires)
      await db.tasks.add(taskRow({ id: 't-boundary', createdAt: '2026-03-15T02:00:00.000Z' }))

      const sameDay = await service.getUnreportedInRange('2026-03-14', '2026-03-14')
      expect(sameDay.map((t) => t.id)).toEqual(['t-boundary'])

      const nextDayOnly = await service.getUnreportedInRange('2026-03-15', '2026-03-15')
      expect(nextDayOnly).toEqual([])
    })
  })

  describe('getUnreportedInRange TZ invariance — America/New_York DST (TS-6)', () => {
    const originalTz = process.env.TZ

    beforeAll(() => {
      process.env.TZ = 'America/New_York'
      // Guard against hosts missing IANA tzdata: without this, the TZ change
      // silently fails to take effect and the DST assertions below would
      // fail with a confusing, unrelated error instead of a clear one.
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York')
    })

    afterAll(() => {
      process.env.TZ = originalTz
    })

    it('resolves the 2026 spring-forward boundary consistently', async () => {
      // 2026-03-08T04:30:00Z is 2026-03-07 23:30 local (EST, UTC-5, before spring forward)
      await db.tasks.add(taskRow({ id: 't-spring', createdAt: '2026-03-08T04:30:00.000Z' }))

      const result = await service.getUnreportedInRange('2026-03-07', '2026-03-07')
      expect(result.map((t) => t.id)).toEqual(['t-spring'])
    })

    it('resolves the 2026 fall-back boundary consistently', async () => {
      // 2026-11-01T03:30:00Z is 2026-10-31 23:30 local (EDT, UTC-4, before fall back)
      await db.tasks.add(taskRow({ id: 't-fall', createdAt: '2026-11-01T03:30:00.000Z' }))

      const result = await service.getUnreportedInRange('2026-10-31', '2026-10-31')
      expect(result.map((t) => t.id)).toEqual(['t-fall'])
    })
  })

  describe('getUnreportedInRange TZ invariance — Asia/Tokyo positive offset (TS-6)', () => {
    const originalTz = process.env.TZ

    beforeAll(() => {
      process.env.TZ = 'Asia/Tokyo'
      // Guard against hosts missing IANA tzdata: without this, the TZ change
      // silently fails to take effect and the offset assertion below would
      // fail with a confusing, unrelated error instead of a clear one.
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo')
    })

    afterAll(() => {
      process.env.TZ = originalTz
    })

    it('resolves a UTC-offset boundary timestamp to the correct local day under a positive offset', async () => {
      // 2026-03-14T15:30:00Z is 2026-03-15 00:30 local (UTC+9, Tokyo) — rolls FORWARD a day
      await db.tasks.add(taskRow({ id: 't-tokyo-boundary', createdAt: '2026-03-14T15:30:00.000Z' }))

      const result = await service.getUnreportedInRange('2026-03-15', '2026-03-15')
      expect(result.map((t) => t.id)).toEqual(['t-tokyo-boundary'])

      const previousDayOnly = await service.getUnreportedInRange('2026-03-14', '2026-03-14')
      expect(previousDayOnly).toEqual([])
    })
  })

  describe('atomicity (TS-8a, TS-8b, TS-8c)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('TS-8a: create() rolls back the task row if note insertion fails', async () => {
      const fixedId = 'fixed-create-id'
      vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(fixedId)
      vi.spyOn(db.taskNotes, 'bulkAdd').mockRejectedValueOnce(new Error('simulated failure'))

      await expect(
        service.create(
          makeTaskInput({
            notes: [{ id: 'n', content: 'orphan?', createdAt: '2020-01-01T00:00:00.000Z' }],
          }),
        ),
      ).rejects.toThrow()

      expect(await db.tasks.get(fixedId)).toBeUndefined()
    })

    it('TS-8b: update() leaves prior state fully intact if note re-insertion fails', async () => {
      const created = await service.create(
        makeTaskInput({
          notes: [{ id: 'a', content: 'original', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      )

      vi.spyOn(db.taskNotes, 'bulkAdd').mockRejectedValueOnce(new Error('simulated failure'))

      await expect(
        service.update(created.id, {
          title: 'should not stick',
          notes: [{ id: 'b', content: 'new note', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      ).rejects.toThrow()

      const afterFailure = await service.getById(created.id)
      expect(afterFailure?.title).toBe(created.title)
      expect(afterFailure?.notes.map((n) => n.content)).toEqual(['original'])
    })

    it('TS-8c: delete() leaves both the task and its notes intact if the task-row delete fails', async () => {
      const created = await service.create(
        makeTaskInput({
          notes: [{ id: 'a', content: 'must survive', createdAt: '2020-01-01T00:00:00.000Z' }],
        }),
      )

      vi.spyOn(db.tasks, 'delete').mockRejectedValueOnce(new Error('simulated failure'))

      await expect(service.delete(created.id)).rejects.toThrow()

      const survivingNotes = await db.taskNotes.where('taskId').equals(created.id).toArray()
      expect(survivingNotes.map((n) => n.content)).toEqual(['must survive'])
      expect(await db.tasks.get(created.id)).toBeDefined()
    })
  })
})
