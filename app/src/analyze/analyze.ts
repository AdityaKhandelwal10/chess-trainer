import { Chess } from 'chess.js'
import type { SeedOpening } from '../openings/seed'
import type { Color } from '../storage/types'
import { sanEquals } from '../drill/drill'

export interface GameAnalysis {
  /** PGN source marker for UI grouping. */
  source: 'lichess' | 'chesscom' | 'pgn'
  playedAt: number
  userColor: Color | null
  result: 'win' | 'loss' | 'draw' | 'unknown'
  /** Best-matching seed opening name, or the PGN header Opening when nothing matches. */
  openingName: string
  /** Best-matching seed line name, or null when outside repertoire. */
  lineName: string | null
  /** Length of the longest repertoire-line prefix the user followed (half-moves). */
  deviationPly: number
  /** The move the user played at `deviationPly`, or null if the game ended first. */
  userDeviatingMove: string | null
  /** The repertoire move at `deviationPly`, or null if the line ended. */
  repertoireMove: string | null
  totalPlies: number
  /** True if no seed line matched even the first user move. */
  outsideRepertoire: boolean
}

function parseDate(header: string | undefined): number {
  if (!header) return 0
  // PGN "Date" is YYYY.MM.DD
  const [y, m, d] = header.split('.').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return 0
  return Date.UTC(y, m - 1, d)
}

function resultFor(color: Color | null, pgnResult: string | undefined): GameAnalysis['result'] {
  if (!pgnResult || !color) return 'unknown'
  if (pgnResult === '1/2-1/2') return 'draw'
  if (pgnResult === '1-0') return color === 'white' ? 'win' : 'loss'
  if (pgnResult === '0-1') return color === 'black' ? 'win' : 'loss'
  return 'unknown'
}

/** Pick the seed line that the user's moves match longest, considering only lines of `userColor`. */
function bestRepertoireMatch(
  userColor: Color,
  userMoves: string[],
  seed: SeedOpening[],
): { opening: SeedOpening; line: SeedOpening['lines'][number]; matchedPlies: number } | null {
  let best: { opening: SeedOpening; line: SeedOpening['lines'][number]; matchedPlies: number } | null =
    null
  for (const op of seed) {
    if (op.opening.color !== userColor) continue
    for (const line of op.lines) {
      let i = 0
      while (
        i < line.moves.length &&
        i < userMoves.length &&
        sanEquals(line.moves[i], userMoves[i])
      ) {
        i++
      }
      if (!best || i > best.matchedPlies) {
        best = { opening: op, line, matchedPlies: i }
      }
    }
  }
  return best
}

export function analyzeGame(
  pgn: string,
  username: string,
  seed: SeedOpening[],
  source: GameAnalysis['source'] = 'pgn',
): GameAnalysis | null {
  const chess = new Chess()
  try {
    chess.loadPgn(pgn)
  } catch {
    return null
  }
  const headers = chess.header() as Record<string, string>
  const white = headers.White ?? ''
  const black = headers.Black ?? ''
  const u = username.toLowerCase()
  const userColor: Color | null =
    white.toLowerCase() === u ? 'white' : black.toLowerCase() === u ? 'black' : null

  const allMoves = chess.history()
  const totalPlies = allMoves.length

  // Game-move list from the user's POV is the full history; we compare against
  // *all* plies (both colors) because seed lines also contain both colors.
  const match = userColor ? bestRepertoireMatch(userColor, allMoves, seed) : null

  const deviationPly = match?.matchedPlies ?? 0
  const userDeviatingMove = deviationPly < allMoves.length ? allMoves[deviationPly] : null
  const repertoireMove =
    match && deviationPly < match.line.moves.length ? match.line.moves[deviationPly] : null

  const outsideRepertoire = !match || match.matchedPlies === 0

  const openingName = outsideRepertoire
    ? headers.Opening || 'Unknown opening'
    : match!.opening.opening.name
  const lineName = outsideRepertoire ? null : match!.line.name

  const playedAt =
    parseDate(headers.UTCDate || headers.Date) ||
    (headers.UTCTime ? Date.now() : 0) ||
    Date.now()

  return {
    source,
    playedAt,
    userColor,
    result: resultFor(userColor, headers.Result),
    openingName,
    lineName,
    deviationPly,
    userDeviatingMove,
    repertoireMove,
    totalPlies,
    outsideRepertoire,
  }
}
