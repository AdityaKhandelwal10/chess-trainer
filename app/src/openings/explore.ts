import { ChessEngine } from '../board/chessEngine'

/**
 * Replay SAN moves up to `ply` (0 = starting position, N = after N plies).
 * Returns the FEN at that point plus the moves actually played (defensive —
 * stops early if an illegal move is encountered).
 */
export function positionAtPly(moves: string[], ply: number): {
  fen: string
  played: string[]
} {
  const engine = new ChessEngine()
  const clamped = Math.max(0, Math.min(ply, moves.length))
  const played: string[] = []
  for (let i = 0; i < clamped; i++) {
    const m = engine.move(moves[i])
    if (!m) break
    played.push(moves[i])
  }
  return { fen: engine.fen(), played }
}

/** Clamp a ply index to [0, moves.length]. */
export function clampPly(ply: number, total: number): number {
  if (ply < 0) return 0
  if (ply > total) return total
  return ply
}
