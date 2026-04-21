import { useEffect, useRef, useState } from 'react'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Key } from 'chessground/types'
import { ChessEngine } from './chessEngine'

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'

type Props = {
  /** Optional callback fired after every legal move (SAN). */
  onMove?: (san: string, fen: string) => void
}

/**
 * Interactive chessboard. Own state = ChessEngine. Chessground is the view.
 * On user drag-drop, we ask the engine for the SAN move, apply it, and sync
 * chessground to the new FEN + dests.
 */
export function Board({ onMove }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<Api | null>(null)
  const engineRef = useRef<ChessEngine>(new ChessEngine())
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const engine = engineRef.current

    const api = Chessground(containerRef.current, {
      fen: engine.fen(),
      turnColor: engine.turn() === 'w' ? 'white' : 'black',
      movable: {
        free: false,
        color: engine.turn() === 'w' ? 'white' : 'black',
        dests: engine.dests() as unknown as Map<Key, Key[]>,
        events: {
          after: (from: Key, to: Key) => {
            const move = engine.moveFromTo(from, to)
            if (!move) {
              // illegal (shouldn't happen since dests gates this), revert UI
              api.set({ fen: engine.fen() })
              return
            }
            api.set({
              fen: engine.fen(),
              turnColor: engine.turn() === 'w' ? 'white' : 'black',
              movable: {
                color: engine.turn() === 'w' ? 'white' : 'black',
                dests: engine.dests() as unknown as Map<Key, Key[]>,
              },
            })
            setHistory(engine.history())
            onMove?.(move.san, engine.fen())
          },
        },
      },
    })
    apiRef.current = api

    return () => api.destroy()
  }, [onMove])

  const reset = () => {
    engineRef.current.reset()
    apiRef.current?.set({
      fen: engineRef.current.fen(),
      turnColor: 'white',
      movable: { color: 'white', dests: engineRef.current.dests() as unknown as Map<Key, Key[]> },
    })
    setHistory([])
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <div ref={containerRef} style={{ width: 480, height: 480 }} />
        <button onClick={reset} style={{ marginTop: 12 }}>
          Reset
        </button>
      </div>
      <div style={{ fontFamily: 'monospace', minWidth: 160 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Moves</div>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          {history.map((san, i) => (
            <li key={i}>{san}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
