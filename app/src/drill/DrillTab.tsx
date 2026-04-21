import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Key } from 'chessground/types'
import type { Opening, Line } from '../storage/types'
import { db } from '../storage/db'
import { ChessEngine } from '../board/chessEngine'
import { expectedMoveAt, isUsersTurn, sanEquals } from './drill'
import { ColorDot } from '../ui/ColorDot'

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'

type Feedback =
  | { kind: 'idle' }
  | { kind: 'wrong'; played: string; expected: string }
  | { kind: 'right' }
  | { kind: 'done' }

/**
 * Drill tab: pick an opening, system plays opponent moves, user must reply
 * with the repertoire's expected move. Wrong moves are rejected with feedback
 * and the board reverts to the pre-move position for a retry.
 */
export function DrillTab() {
  const [openings, setOpenings] = useState<Opening[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [selectedOpeningId, setSelectedOpeningId] = useState<number | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null)
  const [ply, setPly] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' })
  const [revealed, setRevealed] = useState(false)

  const engineRef = useRef<ChessEngine>(new ChessEngine())
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)

  useEffect(() => {
    ;(async () => {
      const [o, l] = await Promise.all([db().openings.toArray(), db().lines.toArray()])
      setOpenings(o)
      setLines(l)
      if (o.length && selectedOpeningId == null) {
        setSelectedOpeningId(o[0].id ?? null)
        const first = l.find((x) => x.openingId === o[0].id)
        setSelectedLineId(first?.id ?? null)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const opening = useMemo(
    () => openings.find((o) => o.id === selectedOpeningId) ?? null,
    [openings, selectedOpeningId],
  )
  const line = useMemo(
    () => lines.find((l) => l.id === selectedLineId) ?? null,
    [lines, selectedLineId],
  )
  const moves = line?.moves ?? []
  const userColor = opening?.color ?? 'white'
  const total = moves.length

  /** Re-read engine state and push it to chessground. */
  const syncBoard = useCallback(() => {
    const engine = engineRef.current
    const isUser = isUsersTurn(userColor, ply)
    const turn = engine.turn() === 'w' ? 'white' : 'black'
    apiRef.current?.set({
      fen: engine.fen(),
      turnColor: turn,
      movable: {
        color: isUser ? turn : undefined,
        dests: isUser ? (engine.dests() as unknown as Map<Key, Key[]>) : new Map(),
      },
    })
  }, [ply, userColor])

  /** Reset drill state to the line's starting position. */
  const restart = useCallback(() => {
    engineRef.current.reset()
    setPly(0)
    setFeedback({ kind: 'idle' })
    setRevealed(false)
  }, [])

  // When opening changes, default to its first line.
  useEffect(() => {
    const first = lines.find((l) => l.openingId === selectedOpeningId)
    setSelectedLineId(first?.id ?? null)
  }, [selectedOpeningId, lines])

  // Re-init board whenever opening or line changes (orientation flip + reset).
  useEffect(() => {
    if (!containerRef.current) return
    if (apiRef.current) apiRef.current.destroy()
    engineRef.current = new ChessEngine()
    setPly(0)
    setFeedback({ kind: 'idle' })
    setRevealed(false)

    const api = Chessground(containerRef.current, {
      fen: engineRef.current.fen(),
      orientation: userColor,
      turnColor: 'white',
      coordinates: true,
      movable: {
        free: false,
        color: userColor === 'white' ? 'white' : undefined,
        dests: engineRef.current.dests() as unknown as Map<Key, Key[]>,
        events: {
          after: (from: Key, to: Key) => {
            onUserDragRef.current?.(from as string, to as string)
          },
        },
      },
    })
    apiRef.current = api
    return () => {
      api.destroy()
      apiRef.current = null
    }
  }, [selectedOpeningId, selectedLineId, userColor])

  /** Handle a user drag-drop: validate against expected SAN. */
  const onUserDrag = useCallback(
    (from: string, to: string) => {
      const engine = engineRef.current
      const expected = expectedMoveAt(moves, ply)
      if (!expected) return

      // Try the move (auto-queen); chess.js gives us SAN back.
      const result = engine.moveFromTo(from, to)
      if (!result) {
        // Illegal per rules — shouldn't happen since we gate via dests.
        syncBoard()
        return
      }

      if (sanEquals(result.san, expected)) {
        // Correct: advance.
        const nextPly = ply + 1
        setPly(nextPly)
        setFeedback({ kind: 'right' })
        setRevealed(false)
      } else {
        // Wrong: undo, flash feedback, stay on same ply.
        engine.undo()
        setFeedback({ kind: 'wrong', played: result.san, expected })
        syncBoard()
      }
    },
    [moves, ply, syncBoard],
  )

  // Keep a ref to the latest handler so the chessground event closure always calls the fresh one.
  const onUserDragRef = useRef(onUserDrag)
  useEffect(() => {
    onUserDragRef.current = onUserDrag
  }, [onUserDrag])

  // Auto-play opponent's move when it's not the user's turn and the line has more moves.
  useEffect(() => {
    if (!line) return
    if (ply >= total) {
      setFeedback({ kind: 'done' })
      syncBoard()
      return
    }
    if (isUsersTurn(userColor, ply)) {
      syncBoard()
      return
    }
    // Opponent move: play after a short delay for visual clarity.
    const nextSan = moves[ply]
    const t = setTimeout(() => {
      const ok = engineRef.current.move(nextSan)
      if (ok) setPly((p) => p + 1)
      // fall through — the ply change re-runs this effect
    }, 400)
    return () => clearTimeout(t)
  }, [ply, total, userColor, line, moves, syncBoard])

  // After engine changes, always push to board.
  useEffect(() => {
    syncBoard()
  }, [syncBoard])

  const isDone = ply >= total && total > 0
  const yourMove = !isDone && isUsersTurn(userColor, ply)

  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)_320px] gap-6 items-start">
      <aside className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 -mr-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-2">
          Drill an opening
        </h2>
        <ul className="space-y-1">
          {openings.map((o) => {
            const active = o.id === selectedOpeningId
            const opLines = lines.filter((l) => l.openingId === o.id)
            return (
              <li key={o.id}>
                <button
                  onClick={() => setSelectedOpeningId(o.id ?? null)}
                  className={
                    active
                      ? 'w-full text-left px-3 py-2 rounded-md bg-[color:var(--bg-panel-2)] border border-[color:var(--border-strong)]'
                      : 'w-full text-left px-3 py-2 rounded-md border border-transparent hover:bg-[color:var(--bg-panel-2)]'
                  }
                >
                  <div className="flex items-center gap-2">
                    <ColorDot color={o.color} />
                    <span className="font-medium text-sm truncate">{o.name}</span>
                  </div>
                  <div className="mt-0.5 ml-4 text-xs text-[color:var(--text-muted)]">
                    {o.eco} · {opLines.length} lines
                  </div>
                </button>
                {active && (
                  <ul className="mt-1 ml-4 space-y-0.5 border-l border-[color:var(--border)] pl-2">
                    {opLines.map((l) => {
                      const lineActive = l.id === selectedLineId
                      return (
                        <li key={l.id}>
                          <button
                            onClick={() => setSelectedLineId(l.id ?? null)}
                            className={
                              lineActive
                                ? 'w-full text-left px-2 py-1 rounded text-xs font-medium bg-[color:var(--highlight-soft)] text-[color:var(--text)]'
                                : 'w-full text-left px-2 py-1 rounded text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--bg-panel-2)]'
                            }
                          >
                            {l.name}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </aside>

      <section className="flex flex-col items-center">
        <div
          className={
            'rounded-lg p-1 transition-[box-shadow] ' +
            (feedback.kind === 'wrong'
              ? 'shadow-[0_0_0_3px_rgba(239,68,68,0.45)]'
              : yourMove
                ? 'shadow-[0_0_0_2px_var(--accent)]'
                : '')
          }
        >
          <div ref={containerRef} className="w-[480px] h-[480px]" />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={restart}
            className="px-3 py-1.5 rounded-md border border-[color:var(--border)] text-sm hover:bg-[color:var(--bg-panel-2)]"
          >
            Restart line
          </button>
          <button
            onClick={() => setRevealed(true)}
            disabled={isDone || !yourMove}
            className="px-3 py-1.5 rounded-md border border-[color:var(--border)] text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--bg-panel-2)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Show answer
          </button>
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        {line ? (
          <>
            <div>
              <div className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] flex items-center gap-1.5">
                <ColorDot color={userColor} /> Playing as {userColor}
              </div>
              <h3 className="mt-0.5 text-base font-semibold">{line.name}</h3>
              <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                Move {Math.floor(ply / 2) + 1} ·{' '}
                <span
                  className={
                    isDone
                      ? 'text-[color:var(--ok)] font-medium'
                      : yourMove
                        ? 'text-[color:var(--accent)] font-medium'
                        : ''
                  }
                >
                  {isDone ? 'line complete' : yourMove ? 'your move' : 'opponent thinking…'}
                </span>
              </div>
            </div>

            <div className="min-h-[72px]">
              {feedback.kind === 'wrong' && (
                <div className="rounded-md border border-red-400/50 bg-red-500/10 p-3 text-sm">
                  <div className="font-semibold text-[color:var(--danger)]">
                    Not the repertoire move.
                  </div>
                  <div className="mt-1">
                    You played{' '}
                    <code className="px-1 rounded bg-[color:var(--bg-panel-2)] font-mono">
                      {feedback.played}
                    </code>
                    . Try again.
                  </div>
                </div>
              )}
              {feedback.kind === 'right' && (
                <div className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-[color:var(--ok)] font-medium">
                  ✓ Correct.
                </div>
              )}
              {feedback.kind === 'done' && (
                <div className="rounded-md border border-blue-500/40 bg-blue-500/10 p-3 text-sm">
                  <div className="font-semibold">End of line 🎉</div>
                  <button
                    onClick={restart}
                    className="mt-2 px-2.5 py-1 rounded border border-[color:var(--border-strong)] text-xs hover:bg-[color:var(--bg-panel-2)]"
                  >
                    Drill again
                  </button>
                </div>
              )}
            </div>

            {revealed && yourMove && (
              <div className="rounded-md border border-[color:var(--border)] p-2.5 text-sm">
                Expected:{' '}
                <code className="px-1.5 py-0.5 rounded bg-[color:var(--highlight-soft)] font-mono font-semibold">
                  {moves[ply]}
                </code>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-1.5">
                Played so far
              </h4>
              {engineRef.current.history().length === 0 ? (
                <div className="text-sm text-[color:var(--text-muted)]">—</div>
              ) : (
                <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-sm">
                  {engineRef.current.history().map((san, i) => (
                    <span key={i}>
                      {i % 2 === 0 && (
                        <span className="text-[color:var(--text-muted)] select-none">
                          {i / 2 + 1}.{' '}
                        </span>
                      )}
                      {san}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-[color:var(--border)] p-6 text-center">
            <div className="text-3xl mb-2" aria-hidden>
              ♞
            </div>
            <div className="font-medium">Pick an opening to drill</div>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">
              Choose a line from the sidebar — the system plays your opponent.
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
