import type { GameAnalysis } from './analyze'

export interface OpeningSummary {
  openingName: string
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
  /** Average deviation ply across games where a repertoire match existed. */
  avgDeviationPly: number
  /** Deepest prefix reached. */
  maxDeviationPly: number
  /** Most common (userDeviatingMove → repertoireMove) pair, or null. */
  topMistake: { played: string; expected: string | null; count: number } | null
  /** How many games were fully outside the seeded repertoire. */
  outsideRepertoireCount: number
}

function mode<T>(items: T[], key: (t: T) => string): { item: T; count: number } | null {
  if (items.length === 0) return null
  const counts = new Map<string, { item: T; count: number }>()
  for (const it of items) {
    const k = key(it)
    const prev = counts.get(k)
    if (prev) prev.count++
    else counts.set(k, { item: it, count: 1 })
  }
  let best: { item: T; count: number } | null = null
  for (const v of counts.values()) {
    if (!best || v.count > best.count) best = v
  }
  return best
}

export function summarize(analyses: GameAnalysis[]): OpeningSummary[] {
  const groups = new Map<string, GameAnalysis[]>()
  for (const a of analyses) {
    const g = groups.get(a.openingName) ?? []
    g.push(a)
    groups.set(a.openingName, g)
  }

  const out: OpeningSummary[] = []
  for (const [openingName, games] of groups) {
    const wins = games.filter((g) => g.result === 'win').length
    const losses = games.filter((g) => g.result === 'loss').length
    const draws = games.filter((g) => g.result === 'draw').length
    const rated = wins + losses + draws
    const winRate = rated === 0 ? 0 : wins / rated

    const withMatch = games.filter((g) => !g.outsideRepertoire)
    const avgDev =
      withMatch.length === 0
        ? 0
        : withMatch.reduce((s, g) => s + g.deviationPly, 0) / withMatch.length
    const maxDev = games.reduce((m, g) => Math.max(m, g.deviationPly), 0)

    const mistakes = games.filter(
      (g) => g.userDeviatingMove != null && !g.outsideRepertoire,
    )
    const top = mode(mistakes, (g) => g.userDeviatingMove!)
    const topMistake =
      top == null
        ? null
        : {
            played: top.item.userDeviatingMove!,
            expected: top.item.repertoireMove,
            count: top.count,
          }

    out.push({
      openingName,
      games: games.length,
      wins,
      losses,
      draws,
      winRate,
      avgDeviationPly: avgDev,
      maxDeviationPly: maxDev,
      topMistake,
      outsideRepertoireCount: games.filter((g) => g.outsideRepertoire).length,
    })
  }

  out.sort((a, b) => b.games - a.games)
  return out
}
