import { useMemo, useState } from 'react'
import { SEED } from '../openings/seed'
import { analyzeGame, type GameAnalysis } from './analyze'
import { summarize, type OpeningSummary } from './aggregate'
import { fetchLichessGames, fetchChesscomGames, type FetchedGame } from './importers'

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultFrom(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 30)
  return toDateInput(d)
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

export function AnalyzeTab() {
  const [lichessUser, setLichessUser] = useState('')
  const [chesscomUser, setChesscomUser] = useState('')
  const [from, setFrom] = useState(defaultFrom())
  const [to, setTo] = useState(toDateInput(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<GameAnalysis[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const summary = useMemo(() => summarize(analyses), [analyses])

  async function handleFetch() {
    setError(null)
    setStatus(null)
    setAnalyses([])
    if (!lichessUser && !chesscomUser) {
      setError('Enter at least one username.')
      return
    }
    const since = Date.UTC(
      ...(from.split('-').map((n) => parseInt(n, 10)) as [number, number, number]),
    ) as number
    const until = Date.UTC(
      ...(to.split('-').map((n) => parseInt(n, 10)) as [number, number, number]),
    ) + 24 * 60 * 60 * 1000 - 1

    setLoading(true)
    try {
      const games: { fetched: FetchedGame; username: string }[] = []

      if (lichessUser) {
        setStatus('Fetching Lichess games…')
        const l = await fetchLichessGames(lichessUser, since, until)
        l.forEach((g) => games.push({ fetched: g, username: lichessUser }))
      }
      if (chesscomUser) {
        setStatus(`Fetched ${games.length}. Fetching Chess.com games…`)
        const c = await fetchChesscomGames(chesscomUser, since, until)
        c.forEach((g) => games.push({ fetched: g, username: chesscomUser }))
      }

      setStatus(`Analyzing ${games.length} games…`)
      const out: GameAnalysis[] = []
      for (const { fetched, username } of games) {
        const a = analyzeGame(fetched.pgn, username, SEED, fetched.source)
        if (a) out.push(a)
      }
      out.sort((a, b) => b.playedAt - a.playedAt)
      setAnalyses(out)
      setStatus(`Done. ${out.length} games analyzed.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
        <h2 className="text-base font-semibold mb-3">Analyze your games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Lichess username">
            <input
              className={inputCls}
              value={lichessUser}
              onChange={(e) => setLichessUser(e.target.value.trim())}
              placeholder="e.g. DrNykterstein"
            />
          </Field>
          <Field label="Chess.com username">
            <input
              className={inputCls}
              value={chesscomUser}
              onChange={(e) => setChesscomUser(e.target.value.trim())}
              placeholder="e.g. Hikaru"
            />
          </Field>
          <Field label="From">
            <input
              type="date"
              className={inputCls}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              className={inputCls}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Fetching…' : 'Fetch & analyze'}
          </button>
          {status && (
            <span className="text-xs text-[color:var(--text-muted)]">{status}</span>
          )}
          {error && <span className="text-xs text-[color:var(--danger)]">{error}</span>}
        </div>
      </section>

      {summary.length > 0 && (
        <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-panel)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--bg-panel-2)] text-left text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
              <tr>
                <Th>Opening</Th>
                <Th>Games</Th>
                <Th>W–D–L</Th>
                <Th>Win rate</Th>
                <Th>Avg deviation</Th>
                <Th>Most common mistake</Th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <SummaryRow
                  key={row.openingName}
                  row={row}
                  expanded={expanded === row.openingName}
                  onToggle={() =>
                    setExpanded(expanded === row.openingName ? null : row.openingName)
                  }
                  games={analyses.filter((a) => a.openingName === row.openingName)}
                />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function SummaryRow({
  row,
  expanded,
  onToggle,
  games,
}: {
  row: OpeningSummary
  expanded: boolean
  onToggle: () => void
  games: GameAnalysis[]
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-t border-[color:var(--border)] hover:bg-[color:var(--bg-panel-2)] cursor-pointer"
      >
        <Td>
          <span className="font-medium">{row.openingName}</span>
          {row.outsideRepertoireCount > 0 && (
            <span className="ml-2 text-xs text-[color:var(--text-muted)]">
              ({row.outsideRepertoireCount} outside)
            </span>
          )}
        </Td>
        <Td>{row.games}</Td>
        <Td>
          <span className="text-[color:var(--ok)]">{row.wins}</span>–{row.draws}–
          <span className="text-[color:var(--danger)]">{row.losses}</span>
        </Td>
        <Td>{pct(row.winRate)}</Td>
        <Td>{row.avgDeviationPly > 0 ? row.avgDeviationPly.toFixed(1) : '—'}</Td>
        <Td>
          {row.topMistake ? (
            <span>
              <code className="text-[color:var(--danger)]">{row.topMistake.played}</code>
              {row.topMistake.expected && (
                <>
                  {' → should be '}
                  <code className="text-[color:var(--ok)]">{row.topMistake.expected}</code>
                </>
              )}
              <span className="ml-1 text-xs text-[color:var(--text-muted)]">
                ×{row.topMistake.count}
              </span>
            </span>
          ) : (
            <span className="text-[color:var(--text-muted)]">—</span>
          )}
        </Td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-[color:var(--bg-panel-2)] px-4 py-3">
            <ul className="space-y-1 text-xs">
              {games.slice(0, 8).map((g, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[color:var(--text-muted)] w-24">
                    {new Date(g.playedAt).toLocaleDateString()}
                  </span>
                  <span className="w-16">{g.userColor}</span>
                  <span className="w-14">{g.result}</span>
                  <span className="w-40 truncate">{g.lineName ?? '(no match)'}</span>
                  <span>
                    deviated at ply {g.deviationPly}
                    {g.userDeviatingMove && (
                      <>
                        : <code className="text-[color:var(--danger)]">{g.userDeviatingMove}</code>
                        {g.repertoireMove && (
                          <>
                            {' vs '}
                            <code className="text-[color:var(--ok)]">{g.repertoireMove}</code>
                          </>
                        )}
                      </>
                    )}
                  </span>
                </li>
              ))}
              {games.length > 8 && (
                <li className="text-[color:var(--text-muted)]">
                  …and {games.length - 8} more
                </li>
              )}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

const inputCls =
  'w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-2.5 py-1.5 text-sm text-[color:var(--text)] focus:outline-none focus:border-[color:var(--accent)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[color:var(--text-muted)]">{label}</span>
      {children}
    </label>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-medium">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 align-top">{children}</td>
}
