import { describe, it, expect } from 'vitest'
import { analyzeGame } from './analyze'
import { SEED } from '../openings/seed'

function buildPgn(white: string, black: string, result: string, moves: string[]): string {
  const movetext: string[] = []
  for (let i = 0; i < moves.length; i += 2) {
    const n = i / 2 + 1
    const w = moves[i]
    const b = moves[i + 1]
    movetext.push(b ? `${n}. ${w} ${b}` : `${n}. ${w}`)
  }
  return (
    `[Event "Test"]\n[White "${white}"]\n[Black "${black}"]\n` +
    `[Result "${result}"]\n[UTCDate "2025.01.15"]\n[UTCTime "12:00:00"]\n\n` +
    `${movetext.join(' ')} ${result}\n`
  )
}

describe('analyzeGame', () => {
  it('detects deep match on Italian main line and deviation after', () => {
    const italian = SEED.find((s) => s.opening.name === 'Italian Game')!.lines[0]
    // Take first 12 plies of Pianissimo, then play a bad 13th move.
    const moves = [...italian.moves.slice(0, 12), 'Nh4']
    const pgn = buildPgn('alice', 'bob', '1-0', moves)
    const a = analyzeGame(pgn, 'alice', SEED)!
    expect(a.userColor).toBe('white')
    expect(a.openingName).toBe('Italian Game')
    expect(a.deviationPly).toBe(12)
    expect(a.userDeviatingMove).toBe('Nh4')
    expect(a.repertoireMove).toBe(italian.moves[12])
    expect(a.result).toBe('win')
    expect(a.outsideRepertoire).toBe(false)
  })

  it('marks wholly-outside-repertoire games', () => {
    const pgn = buildPgn('alice', 'bob', '0-1', ['f4', 'e5', 'g4', 'Qh4#'])
    const a = analyzeGame(pgn, 'alice', SEED)!
    expect(a.outsideRepertoire).toBe(true)
    expect(a.lineName).toBeNull()
    expect(a.deviationPly).toBe(0)
    expect(a.userDeviatingMove).toBe('f4')
    expect(a.result).toBe('loss')
  })

  it('full match of a seed line hits end with no deviating move', () => {
    const caro = SEED.find((s) => s.opening.name === 'Caro-Kann Defense')!.lines.find(
      (l) => l.name === 'Classical Main Line',
    )!
    const pgn = buildPgn('white', 'alice', '1/2-1/2', caro.moves)
    const a = analyzeGame(pgn, 'alice', SEED)!
    expect(a.userColor).toBe('black')
    expect(a.openingName).toBe('Caro-Kann Defense')
    expect(a.deviationPly).toBe(caro.moves.length)
    expect(a.userDeviatingMove).toBeNull()
    expect(a.repertoireMove).toBeNull()
    expect(a.result).toBe('draw')
  })
})
