import { describe, it, expect, beforeEach } from 'vitest'
import { ChessTrainerDB } from './db'
import { seedIfEmpty } from './seedLoader'
import { SEED } from '../openings/seed'
import { ChessEngine } from '../board/chessEngine'

let testDb: ChessTrainerDB

beforeEach(async () => {
  // Fresh DB per test, isolated by unique name.
  localStorage.clear()
  testDb = new ChessTrainerDB(`test-${crypto.randomUUID()}`)
  await testDb.open()
})

describe('seedLoader', () => {
  it('loads seed openings on an empty DB', async () => {
    const seeded = await seedIfEmpty(testDb)
    expect(seeded).toBe(true)
    const openings = await testDb.openings.toArray()
    expect(openings).toHaveLength(SEED.length)
    expect(openings.map((o) => o.name).sort()).toEqual(SEED.map((s) => s.opening.name).sort())
  })

  it('is idempotent — does not re-seed an already-populated DB', async () => {
    await seedIfEmpty(testDb)
    const seededAgain = await seedIfEmpty(testDb)
    expect(seededAgain).toBe(false)
    expect(await testDb.openings.count()).toBe(SEED.length)
  })

  it('associates each line with its opening', async () => {
    await seedIfEmpty(testDb)
    const italian = await testDb.openings.where('name').equals('Italian Game').first()
    expect(italian).toBeDefined()
    const lines = await testDb.lines.where('openingId').equals(italian!.id!).toArray()
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].moves[0]).toBe('e4')
  })
})

describe('seed data integrity', () => {
  it('every seed move list is a legal chess game', () => {
    for (const { opening, lines } of SEED) {
      for (const line of lines) {
        const e = new ChessEngine()
        for (const san of line.moves) {
          const move = e.move(san)
          expect(move, `Illegal move "${san}" in ${opening.name} / ${line.name}`).not.toBeNull()
        }
      }
    }
  })

  it('every opening has at least 2 lines', () => {
    for (const { opening, lines } of SEED) {
      expect(lines.length, `${opening.name} has too few lines`).toBeGreaterThanOrEqual(2)
    }
  })
})
