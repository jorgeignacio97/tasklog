import { db } from '../../lib/db'

/**
 * Test-only helper. Never imported by production code.
 *
 * Registers a `beforeEach` hook that clears the `tasks`, `reports`, and
 * `taskNotes` tables in a single transaction, keeping the real Dexie
 * singleton isolated between tests without recreating the database.
 */
export function resetDbBeforeEach(): void {
  beforeEach(async () => {
    await db.transaction('rw', db.tasks, db.reports, db.taskNotes, async () => {
      await Promise.all([
        db.tasks.clear(),
        db.reports.clear(),
        db.taskNotes.clear(),
      ])
    })
  })
}
