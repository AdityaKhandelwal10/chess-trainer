import { describe, it, expect } from 'vitest'
import { isUsersTurn, expectedMoveAt, sanEquals, normalizeSan } from './drill'

describe('isUsersTurn', () => {
  it('white repertoire: user plays even plies', () => {
    expect(isUsersTurn('white', 0)).toBe(true)
    expect(isUsersTurn('white', 1)).toBe(false)
    expect(isUsersTurn('white', 4)).toBe(true)
  })
  it('black repertoire: user plays odd plies', () => {
    expect(isUsersTurn('black', 0)).toBe(false)
    expect(isUsersTurn('black', 1)).toBe(true)
    expect(isUsersTurn('black', 3)).toBe(true)
  })
})

describe('expectedMoveAt', () => {
  it('returns the move at ply', () => {
    expect(expectedMoveAt(['e4', 'e5', 'Nf3'], 1)).toBe('e5')
  })
  it('returns null past the end', () => {
    expect(expectedMoveAt(['e4'], 5)).toBeNull()
  })
  it('returns null for negative', () => {
    expect(expectedMoveAt(['e4'], -1)).toBeNull()
  })
})

describe('sanEquals', () => {
  it('ignores check/mate markers', () => {
    expect(sanEquals('Nf3', 'Nf3+')).toBe(true)
    expect(sanEquals('Qh5', 'Qh5#')).toBe(true)
  })
  it('ignores annotation marks', () => {
    expect(sanEquals('Bb5!', 'Bb5')).toBe(true)
  })
  it('distinguishes different moves', () => {
    expect(sanEquals('Nf3', 'Nc3')).toBe(false)
  })
})

describe('normalizeSan', () => {
  it('strips + # ! ?', () => {
    expect(normalizeSan('Qxf7#!')).toBe('Qxf7')
  })
})
