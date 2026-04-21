import { Chess, type Move } from 'chess.js'

export type Square = string
export type Color = 'w' | 'b'

/**
 * Thin wrapper over chess.js that exposes only what the UI needs.
 * Keeps chess.js as an implementation detail so we can swap later.
 */
export class ChessEngine {
  private game: Chess

  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess()
  }

  fen(): string {
    return this.game.fen()
  }

  turn(): Color {
    return this.game.turn()
  }

  history(): string[] {
    return this.game.history()
  }

  /** Attempts a move; returns the Move on success, null if illegal. */
  move(san: string): Move | null {
    try {
      return this.game.move(san)
    } catch {
      return null
    }
  }

  /** Move by from/to squares (used by drag-drop). Auto-promotes to queen. */
  moveFromTo(from: Square, to: Square): Move | null {
    try {
      return this.game.move({ from, to, promotion: 'q' })
    } catch {
      return null
    }
  }

  undo(): Move | null {
    return this.game.undo()
  }

  reset(): void {
    this.game.reset()
  }

  /**
   * Map of `from` square -> legal `to` squares for the side to move.
   * Shape matches what chessground expects for its `movable.dests` option.
   */
  dests(): Map<Square, Square[]> {
    const map = new Map<Square, Square[]>()
    for (const move of this.game.moves({ verbose: true })) {
      const list = map.get(move.from) ?? []
      list.push(move.to)
      map.set(move.from, list)
    }
    return map
  }
}
