import type { Color } from '../storage/types'

/**
 * Whose move is it at this ply, given the user's repertoire color?
 * White repertoire → user plays even plies (0, 2, 4…).
 * Black repertoire → user plays odd plies (1, 3, 5…).
 */
export function isUsersTurn(color: Color, ply: number): boolean {
  return color === 'white' ? ply % 2 === 0 : ply % 2 === 1
}

/** Expected SAN at `ply`, or null if past the end of the line. */
export function expectedMoveAt(moves: string[], ply: number): string | null {
  if (ply < 0 || ply >= moves.length) return null
  return moves[ply]
}

/** Normalize SAN for comparison (strip check/mate markers and any "!"/"?" annotations). */
export function normalizeSan(san: string): string {
  return san.replace(/[+#!?]/g, '')
}

/** Are two SAN strings equivalent as chess moves? */
export function sanEquals(a: string, b: string): boolean {
  return normalizeSan(a) === normalizeSan(b)
}
