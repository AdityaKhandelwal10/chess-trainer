import Dexie, { type EntityTable } from 'dexie'
import type { Opening, Line, ReviewCard, Game } from './types'

export class ChessTrainerDB extends Dexie {
  openings!: EntityTable<Opening, 'id'>
  lines!: EntityTable<Line, 'id'>
  reviewCards!: EntityTable<ReviewCard, 'id'>
  games!: EntityTable<Game, 'id'>

  constructor(name = 'chess-trainer') {
    super(name)
    this.version(1).stores({
      openings: '++id, name, eco, color',
      lines: '++id, openingId, name',
      reviewCards: '++id, lineId, dueAt',
      games: '++id, source, playedAt',
    })
  }
}

/** Lazy singleton so tests can create their own isolated DBs. */
let _db: ChessTrainerDB | null = null
export function db(): ChessTrainerDB {
  if (!_db) _db = new ChessTrainerDB()
  return _db
}
