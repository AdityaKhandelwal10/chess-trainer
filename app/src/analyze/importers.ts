export interface FetchedGame {
  source: 'lichess' | 'chesscom'
  pgn: string
  playedAt: number
}

function splitPgns(text: string): string[] {
  // PGN documents are separated by a blank line following the moves section.
  // A robust split: split on `\n\n[Event ` and rejoin the tag.
  const parts = text.split(/\n\n(?=\[Event )/)
  return parts.map((p) => p.trim()).filter(Boolean)
}

export async function fetchLichessGames(
  username: string,
  since: number,
  until: number,
  max = 300,
): Promise<FetchedGame[]> {
  if (!username) return []
  const url =
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}` +
    `?since=${since}&until=${until}&max=${max}` +
    `&perfType=blitz,rapid,classical&clocks=false&evals=false&opening=true`
  const res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } })
  if (!res.ok) throw new Error(`Lichess fetch failed: ${res.status}`)
  const text = await res.text()
  const pgns = splitPgns(text)
  return pgns.map((pgn) => {
    const dateMatch = pgn.match(/\[UTCDate "([^"]+)"\]/)
    const timeMatch = pgn.match(/\[UTCTime "([^"]+)"\]/)
    let playedAt = 0
    if (dateMatch) {
      const [y, m, d] = dateMatch[1].split('.').map((n) => parseInt(n, 10))
      const [hh = 0, mm = 0, ss = 0] = (timeMatch?.[1] ?? '')
        .split(':')
        .map((n) => parseInt(n, 10))
      if (y && m && d) playedAt = Date.UTC(y, m - 1, d, hh, mm, ss)
    }
    return { source: 'lichess' as const, pgn, playedAt }
  })
}

interface ChesscomArchive {
  archives: string[]
}
interface ChesscomGame {
  pgn?: string
  end_time?: number
  rules?: string
  time_class?: string
}
interface ChesscomMonthlyGames {
  games: ChesscomGame[]
}

export async function fetchChesscomGames(
  username: string,
  since: number,
  until: number,
): Promise<FetchedGame[]> {
  if (!username) return []
  const archivesRes = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`,
  )
  if (!archivesRes.ok) throw new Error(`Chess.com archives fetch failed: ${archivesRes.status}`)
  const { archives } = (await archivesRes.json()) as ChesscomArchive

  const fromMonth = new Date(since)
  const toMonth = new Date(until)
  const inRange = archives.filter((u) => {
    const m = u.match(/\/(\d{4})\/(\d{2})$/)
    if (!m) return false
    const y = parseInt(m[1], 10)
    const mo = parseInt(m[2], 10)
    const start = Date.UTC(y, mo - 1, 1)
    const end = Date.UTC(y, mo, 1)
    return end > since && start <= Date.UTC(toMonth.getUTCFullYear(), toMonth.getUTCMonth() + 1, 1) &&
      start <= until &&
      end > Date.UTC(fromMonth.getUTCFullYear(), fromMonth.getUTCMonth(), 1)
  })

  const out: FetchedGame[] = []
  for (const url of inRange) {
    const res = await fetch(url)
    if (!res.ok) continue
    const { games } = (await res.json()) as ChesscomMonthlyGames
    for (const g of games) {
      if (!g.pgn || g.rules !== 'chess') continue
      const endMs = (g.end_time ?? 0) * 1000
      if (endMs < since || endMs > until) continue
      if (!['blitz', 'rapid', 'classical', 'daily'].includes(g.time_class ?? '')) continue
      out.push({ source: 'chesscom', pgn: g.pgn, playedAt: endMs })
    }
  }
  return out
}
