import { describe, it, expect } from 'vitest'
import { ChessEngine } from './chessEngine'

describe('ChessEngine', () => {
  it('starts at the standard opening position', () => {
    const e = new ChessEngine()
    expect(e.fen().startsWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toBe(true)
    expect(e.turn()).toBe('w')
    expect(e.history()).toEqual([])
  })

  it('plays a legal move and updates state', () => {
    const e = new ChessEngine()
    const move = e.move('e4')
    expect(move).not.toBeNull()
    expect(move!.san).toBe('e4')
    expect(e.turn()).toBe('b')
    expect(e.history()).toEqual(['e4'])
  })

  it('rejects an illegal move by returning null', () => {
    const e = new ChessEngine()
    const move = e.move('e5') // illegal for white's first move
    expect(move).toBeNull()
    expect(e.history()).toEqual([])
    expect(e.turn()).toBe('w')
  })

  it('can undo the last move', () => {
    const e = new ChessEngine()
    e.move('e4')
    e.undo()
    expect(e.turn()).toBe('w')
    expect(e.history()).toEqual([])
  })

  it('reports dests for the side to move (for board highlighting)', () => {
    const e = new ChessEngine()
    const dests = e.dests()
    expect(dests.get('e2')).toContain('e4')
    expect(dests.get('e2')).toContain('e3')
    expect(dests.get('g1')).toContain('f3')
  })

  it('plays a move via from/to coordinates (drag-drop source)', () => {
    const e = new ChessEngine()
    const move = e.moveFromTo('e2', 'e4')
    expect(move?.san).toBe('e4')
    expect(e.history()).toEqual(['e4'])
  })

  it('auto-promotes to queen on pawn promotion', () => {
    const e = new ChessEngine('8/P7/8/8/8/8/8/k6K w - - 0 1')
    const move = e.moveFromTo('a7', 'a8')
    expect(move?.san).toBe('a8=Q+')
  })

  it('resets to the starting position', () => {
    const e = new ChessEngine()
    e.move('e4')
    e.move('e5')
    e.reset()
    expect(e.history()).toEqual([])
    expect(e.turn()).toBe('w')
  })
})
