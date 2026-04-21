export type Color = 'white' | 'black'

export interface OpeningExtract {
  idea: string
  pawnStructure: string
  keyPieces: string
  yourPlan: string
  opponentPlan: string
  commonTraps: string
}

export interface Opening {
  id?: number
  name: string
  eco: string
  color: Color
  /** Short description shown in the explore tab. */
  description?: string
  /** Structured strategic summary (idea, plans, traps). */
  extract?: OpeningExtract
}

export interface Line {
  id?: number
  openingId: number
  name: string
  /** SAN moves, in order from the start of the game. */
  moves: string[]
  notes?: string
}

export interface ReviewCard {
  id?: number
  lineId: number
  fen: string
  expectedMove: string
  ease: number
  interval: number
  dueAt: number
}

export interface Game {
  id?: number
  source: 'lichess' | 'chesscom'
  pgn: string
  playedAt: number
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
}
