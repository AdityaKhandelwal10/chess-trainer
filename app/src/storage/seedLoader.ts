import type { ChessTrainerDB } from './db'
import { SEED, SEED_VERSION } from '../openings/seed'

const VERSION_KEY = 'chess-trainer.seedVersion'

/**
 * Populate the DB with seed openings + lines.
 *
 * - If empty: seed fresh.
 * - If non-empty but localStorage `seedVersion` < current SEED_VERSION:
 *   clear openings + lines (and reviewCards derived from lines) and re-seed.
 * - Otherwise: no-op.
 *
 * Returns true if the DB was (re)seeded.
 */
export async function seedIfEmpty(db: ChessTrainerDB): Promise<boolean> {
  const storedRaw =
    typeof localStorage !== 'undefined' ? localStorage.getItem(VERSION_KEY) : null
  const stored = storedRaw ? parseInt(storedRaw, 10) : 0
  const count = await db.openings.count()

  if (count > 0 && stored >= SEED_VERSION) return false

  await db.transaction('rw', db.openings, db.lines, db.reviewCards, async () => {
    await db.reviewCards.clear()
    await db.lines.clear()
    await db.openings.clear()
    for (const { opening, lines } of SEED) {
      const openingId = await db.openings.add(opening)
      for (const line of lines) {
        await db.lines.add({ ...line, openingId: openingId as number })
      }
    }
  })

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION))
  }
  return true
}
