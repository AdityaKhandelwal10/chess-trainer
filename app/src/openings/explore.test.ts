import { describe, it, expect } from 'vitest'
import { positionAtPly, clampPly } from './explore'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('positionAtPly', () => {
  it('ply 0 returns the starting position', () => {
    const { fen, played } = positionAtPly(['e4', 'e5'], 0)
    expect(fen).toBe(STARTING_FEN)
    expect(played).toEqual([])
  })

  it('plays up to the requested ply', () => {
    const { fen, played } = positionAtPly(['e4', 'e5', 'Nf3'], 2)
    expect(played).toEqual(['e4', 'e5'])
    // Black to move after 1.e4 e5
    expect(fen.split(' ')[1]).toBe('w')
    expect(fen).toContain('rnbqkbnr/pppp1ppp')
  })

  it('clamps ply above the move count to the full line', () => {
    const { played } = positionAtPly(['e4', 'e5'], 99)
    expect(played).toEqual(['e4', 'e5'])
  })

  it('clamps negative ply to 0', () => {
    const { fen, played } = positionAtPly(['e4'], -3)
    expect(fen).toBe(STARTING_FEN)
    expect(played).toEqual([])
  })

  it('stops early on an illegal move (defensive)', () => {
    const { played } = positionAtPly(['e4', 'e9'], 2)
    expect(played).toEqual(['e4'])
  })
})

describe('clampPly', () => {
  it('clamps below range', () => {
    expect(clampPly(-5, 8)).toBe(0)
  })
  it('clamps above range', () => {
    expect(clampPly(99, 8)).toBe(8)
  })
  it('passes through in-range', () => {
    expect(clampPly(3, 8)).toBe(3)
  })
})
