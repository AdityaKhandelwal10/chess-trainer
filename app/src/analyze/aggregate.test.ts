import { describe, it, expect } from 'vitest'
import { summarize } from './aggregate'
import type { GameAnalysis } from './analyze'

function mk(over: Partial<GameAnalysis>): GameAnalysis {
  return {
    source: 'pgn',
    playedAt: 0,
    userColor: 'white',
    result: 'win',
    openingName: 'Italian Game',
    lineName: 'Main',
    deviationPly: 10,
    userDeviatingMove: 'Nh4',
    repertoireMove: 'Nf1',
    totalPlies: 30,
    outsideRepertoire: false,
    ...over,
  }
}

describe('summarize', () => {
  it('groups by opening, counts results, finds modal mistake', () => {
    const games: GameAnalysis[] = [
      mk({ result: 'win', deviationPly: 10, userDeviatingMove: 'Nh4' }),
      mk({ result: 'loss', deviationPly: 12, userDeviatingMove: 'Nh4' }),
      mk({ result: 'draw', deviationPly: 8, userDeviatingMove: 'Bg5' }),
      mk({
        openingName: 'Caro-Kann Defense',
        result: 'win',
        deviationPly: 14,
        userDeviatingMove: 'Nf6',
        repertoireMove: 'Bh7',
      }),
      mk({
        openingName: 'Unknown opening',
        outsideRepertoire: true,
        deviationPly: 0,
        userDeviatingMove: 'f4',
        repertoireMove: null,
        result: 'loss',
      }),
    ]
    const s = summarize(games)
    const italian = s.find((r) => r.openingName === 'Italian Game')!
    expect(italian.games).toBe(3)
    expect(italian.wins).toBe(1)
    expect(italian.losses).toBe(1)
    expect(italian.draws).toBe(1)
    expect(italian.winRate).toBeCloseTo(1 / 3)
    expect(italian.avgDeviationPly).toBeCloseTo(10)
    expect(italian.maxDeviationPly).toBe(12)
    expect(italian.topMistake?.played).toBe('Nh4')
    expect(italian.topMistake?.count).toBe(2)

    const outside = s.find((r) => r.openingName === 'Unknown opening')!
    expect(outside.outsideRepertoireCount).toBe(1)
    expect(outside.topMistake).toBeNull()

    // sorted by games desc: Italian first
    expect(s[0].openingName).toBe('Italian Game')
  })
})
