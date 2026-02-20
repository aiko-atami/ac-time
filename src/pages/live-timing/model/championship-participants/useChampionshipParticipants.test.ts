// Verifies participant registration matching rules for class/car fallback scenarios.
import { describe, expect, it } from 'vitest'

import {
  hasDeclaredCar,
  matchesParticipantCandidate,
  toCarTokens,
} from './useChampionshipParticipants'

describe('useChampionshipParticipants matching utilities', () => {
  it('treats empty and "-" csv car values as not declared', () => {
    expect(hasDeclaredCar('')).toBe(false)
    expect(hasDeclaredCar('   ')).toBe(false)
    expect(hasDeclaredCar('-')).toBe(false)
    expect(hasDeclaredCar(' - ')).toBe(false)
    expect(hasDeclaredCar('BMW M4 GT3')).toBe(true)
  })

  it('matches by class only when participant car is not declared', () => {
    const result = matchesParticipantCandidate(
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt3',
        hasDeclaredCar: false,
        carTokens: [],
      },
      'gt3',
      toCarTokens('Ferrari 296 GT3'),
    )

    expect(result).toBe(true)
  })

  it('does not match when class differs even if participant car is not declared', () => {
    const result = matchesParticipantCandidate(
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt4',
        hasDeclaredCar: false,
        carTokens: [],
      },
      'gt3',
      toCarTokens('Ferrari 296 GT3'),
    )

    expect(result).toBe(false)
  })

  it('requires car token overlap when participant car is declared', () => {
    const matchingResult = matchesParticipantCandidate(
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt3',
        hasDeclaredCar: true,
        carTokens: toCarTokens('LADA Vesta NG Super-production'),
      },
      'gt3',
      toCarTokens('LADA Vesta NG TCR'),
    )

    const nonMatchingResult = matchesParticipantCandidate(
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt3',
        hasDeclaredCar: true,
        carTokens: toCarTokens('LADA Vesta NG Super-production'),
      },
      'gt3',
      toCarTokens('Hyundai Elantra N TCR'),
    )

    expect(matchingResult).toBe(true)
    expect(nonMatchingResult).toBe(false)
  })

  it('matches if at least one same-name candidate has empty car and class match', () => {
    const entryClass = 'gt3'
    const entryCarTokens = toCarTokens('Ferrari 296 GT3')

    const candidates = [
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt3',
        hasDeclaredCar: true,
        carTokens: toCarTokens('LADA Vesta NG Super-production'),
      },
      {
        nameKey: 'ivan ivanov',
        carClass: 'gt3',
        hasDeclaredCar: false,
        carTokens: [],
      },
    ]

    const result = candidates.some(candidate => matchesParticipantCandidate(candidate, entryClass, entryCarTokens))

    expect(result).toBe(true)
  })
})
