import { useEffect, useMemo, useRef, useState } from 'react'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Opening, Line } from '../storage/types'
import { db } from '../storage/db'
import { positionAtPly, clampPly } from './explore'
import { ColorDot } from '../ui/ColorDot'

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'

/**
 * Explore tab: three-pane layout.
 * - Left: openings, expandable to line list.
 * - Center: board, ply controls.
 * - Right: move list, notes, strategic extract.
 */
export function Explore() {
  const [openings, setOpenings] = useState<Opening[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [selectedOpeningId, setSelectedOpeningId] = useState<number | null>(null)
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null)
  const [ply, setPly] = useState(0)

  useEffect(() => {
    ;(async () => {
      const [o, l] = await Promise.all([db().openings.toArray(), db().lines.toArray()])
      setOpenings(o)
      setLines(l)
      if (o.length && selectedOpeningId == null) {
        const firstOp = o[0]
        setSelectedOpeningId(firstOp.id ?? null)
        const firstLine = l.find((x) => x.openingId === firstOp.id)
        setSelectedLineId(firstLine?.id ?? null)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedLine = useMemo(
    () => lines.find((l) => l.id === selectedLineId) ?? null,
    [lines, selectedLineId],
  )
  const selectedOpening = useMemo(
    () => openings.find((o) => o.id === selectedOpeningId) ?? null,
    [openings, selectedOpeningId],
  )
  const moves = selectedLine?.moves ?? []
  const total = moves.length
  const { fen } = useMemo(() => positionAtPly(moves, ply), [moves, ply])

  useEffect(() => {
    const first = lines.find((l) => l.openingId === selectedOpeningId)
    setSelectedLineId(first?.id ?? null)
  }, [selectedOpeningId, lines])

  useEffect(() => {
    setPly(0)
  }, [selectedOpeningId, selectedLineId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        setPly((p) => clampPly(p + 1, total))
        e.preventDefault()
      } else if (e.key === 'ArrowLeft') {
        setPly((p) => clampPly(p - 1, total))
        e.preventDefault()
      } else if (e.key === 'Home') {
        setPly(0)
        e.preventDefault()
      } else if (e.key === 'End') {
        setPly(total)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const api = Chessground(containerRef.current, {
      fen,
      viewOnly: true,
      orientation: selectedOpening?.color ?? 'white',
      coordinates: true,
    })
    apiRef.current = api
    return () => api.destroy()
  }, [selectedOpening?.color])

  useEffect(() => {
    apiRef.current?.set({ fen })
  }, [fen])

  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)_320px] gap-6 items-start">
      <OpeningSidebar
        openings={openings}
        lines={lines}
        selectedOpeningId={selectedOpeningId}
        selectedLineId={selectedLineId}
        onSelectOpening={setSelectedOpeningId}
        onSelectLine={setSelectedLineId}
      />

      <section className="flex flex-col items-center">
        <div className="relative">
          <div ref={containerRef} className="w-[480px] h-[480px]" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
          <span>Keys:</span>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          <span>step</span>
          <span className="mx-1 opacity-40">·</span>
          <Kbd>Home</Kbd>
          <Kbd>End</Kbd>
          <span>jump</span>
        </div>
      </section>

      <aside className="min-w-0">
        {selectedLine ? (
          <LineDetail
            opening={selectedOpening}
            line={selectedLine}
            moves={moves}
            ply={ply}
            total={total}
            onJump={setPly}
          />
        ) : (
          <EmptyPanel
            title="Pick a line"
            body="Choose an opening from the sidebar to step through a line."
          />
        )}
      </aside>
    </div>
  )
}

function OpeningSidebar({
  openings,
  lines,
  selectedOpeningId,
  selectedLineId,
  onSelectOpening,
  onSelectLine,
}: {
  openings: Opening[]
  lines: Line[]
  selectedOpeningId: number | null
  selectedLineId: number | null
  onSelectOpening: (id: number | null) => void
  onSelectLine: (id: number | null) => void
}) {
  return (
    <aside className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 -mr-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] mb-2">
        Openings
      </h2>
      <ul className="space-y-1">
        {openings.map((o) => {
          const active = o.id === selectedOpeningId
          const opLines = lines.filter((l) => l.openingId === o.id)
          return (
            <li key={o.id}>
              <button
                onClick={() => onSelectOpening(o.id ?? null)}
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
                          onClick={() => onSelectLine(l.id ?? null)}
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
  )
}

function LineDetail({
  opening,
  line,
  moves,
  ply,
  total,
  onJump,
}: {
  opening: Opening | null
  line: Line
  moves: string[]
  ply: number
  total: number
  onJump: (ply: number) => void
}) {
  // Pair moves into "1. e4 e5" format for the move list.
  const pairs: { num: number; white: string; black?: string; wPly: number; bPly?: number }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1],
      wPly: i + 1,
      bPly: i + 2 <= moves.length ? i + 2 : undefined,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">
          {opening?.name}
        </div>
        <h3 className="mt-0.5 text-base font-semibold">{line.name}</h3>
      </div>

      <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm leading-6">
          {pairs.map((p) => (
            <span key={p.num} className="whitespace-nowrap">
              <span className="text-[color:var(--text-muted)] select-none">{p.num}.</span>{' '}
              <MoveButton san={p.white} active={ply === p.wPly} onClick={() => onJump(p.wPly)} />
              {p.black && (
                <>
                  {' '}
                  <MoveButton
                    san={p.black}
                    active={ply === p.bPly}
                    onClick={() => p.bPly && onJump(p.bPly)}
                  />
                </>
              )}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs">
          <NavBtn onClick={() => onJump(0)} disabled={ply === 0} label="⏮" title="Start" />
          <NavBtn
            onClick={() => onJump(clampPly(ply - 1, total))}
            disabled={ply === 0}
            label="◀"
            title="Previous"
          />
          <NavBtn
            onClick={() => onJump(clampPly(ply + 1, total))}
            disabled={ply === total}
            label="▶"
            title="Next"
          />
          <NavBtn
            onClick={() => onJump(total)}
            disabled={ply === total}
            label="⏭"
            title="End"
          />
          <span className="ml-auto text-[color:var(--text-muted)]">
            {ply} / {total}
          </span>
        </div>
      </div>

      {line.notes && (
        <Section title="Notes">
          <p className="text-sm leading-relaxed text-[color:var(--text)]">{line.notes}</p>
        </Section>
      )}

      {opening?.description && (
        <Section title="About this opening">
          <p className="text-sm leading-relaxed text-[color:var(--text)]">{opening.description}</p>
        </Section>
      )}

      {opening?.extract && (
        <Section title="Strategic summary">
          <dl className="space-y-2.5 text-sm">
            {(
              [
                ['Idea', opening.extract.idea],
                ['Pawn structure', opening.extract.pawnStructure],
                ['Key pieces', opening.extract.keyPieces],
                ['Your plan', opening.extract.yourPlan],
                ["Opponent's plan", opening.extract.opponentPlan],
                ['Common traps', opening.extract.commonTraps],
              ] as const
            ).map(([label, text]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                  {label}
                </dt>
                <dd className="mt-0.5 leading-relaxed text-[color:var(--text)]">{text}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
        {title}
      </h4>
      {children}
    </section>
  )
}

function MoveButton({
  san,
  active,
  onClick,
}: {
  san: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'px-1 rounded bg-[color:var(--highlight-soft)] text-[color:var(--text)]'
          : 'px-1 rounded text-[color:var(--text)] hover:bg-[color:var(--bg-panel-2)]'
      }
    >
      {san}
    </button>
  )
}

function NavBtn({
  onClick,
  disabled,
  label,
  title,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  title: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-2 py-1 rounded border border-[color:var(--border)] text-[color:var(--text)] hover:bg-[color:var(--bg-panel-2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {label}
    </button>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded border border-[color:var(--border)] bg-[color:var(--bg-panel)] text-[10px] font-mono text-[color:var(--text)]">
      {children}
    </kbd>
  )
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-[color:var(--border)] p-6 text-center">
      <div className="text-3xl mb-2" aria-hidden>
        ♟
      </div>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm text-[color:var(--text-muted)]">{body}</div>
    </div>
  )
}
