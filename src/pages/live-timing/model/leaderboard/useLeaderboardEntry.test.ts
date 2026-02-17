// Tests for derived row/card metadata returned by getLeaderboardEntryMeta.
import type { ProcessedEntry } from '@/shared/types'
import { describe, expect, it } from 'vitest'
import { getLeaderboardEntryMeta } from './useLeaderboardEntry'

/**
 * Builds reusable entry fixture with overridable fields.
 * @param overrides Partial entry values for scenario-specific setup.
 * @returns Fully populated processed entry.
 */
function createEntry(overrides: Partial<ProcessedEntry> = {}): ProcessedEntry {
  return {
    id: 'driver-1_car-1',
    driverName: 'Driver 1',
    carName: 'Car 1',
    carModel: 'car-1',
    carClass: 'GT3',
    teamName: 'Team 1',
    bestLap: 104000,
    splits: [],
    bestLapSplits: [],
    theoreticalBestLap: null,
    lapCount: 7,
    ...overrides,
  }
}

describe('getLeaderboardEntryMeta', () => {
  it('should compute percentage and delta for valid laps', () => {
    const entry = createEntry({ bestLap: 102000 })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.percentage).toBe(102)
    expect(result.deltaToLeaderMs).toBe(2000)
    expect(result.deltaText).toBe('+2.000')
  })

  it('should return null percentage and placeholder delta for missing best lap', () => {
    const entry = createEntry({ bestLap: null })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.percentage).toBeNull()
    expect(result.deltaToLeaderMs).toBeNull()
    expect(result.deltaText).toBe('-')
  })

  it('should clamp negative delta to zero when entry lap is better than provided leader', () => {
    const entry = createEntry({ bestLap: 99000 })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.deltaToLeaderMs).toBe(0)
    expect(result.deltaText).toBe('+0.000')
  })

  it('should produce normal badge class below warning threshold', () => {
    const entry = createEntry({ bestLap: 104000 })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.badgeClass).toContain('bg-muted')
  })

  it('should produce warning badge class in warning window', () => {
    const entry = createEntry({ bestLap: 106000 })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.badgeClass).toContain('bg-amber-500/10')
  })

  it('should produce destructive badge class above threshold', () => {
    const entry = createEntry({ bestLap: 108000 })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.badgeClass).toContain('bg-destructive/10')
  })

  it('should include both best and theoretical splits in tooltip when available', () => {
    const entry = createEntry({
      bestLapSplits: [30000, 31000, 32000],
      splits: [29500, 30500, 31500],
    })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.tooltipText).toContain('Best:')
    expect(result.tooltipText).toContain('Theor:')
    expect(result.hasSplits).toBe(true)
  })

  it('should show no-sector fallback text when splits are absent', () => {
    const entry = createEntry({
      bestLapSplits: [],
      splits: [],
    })
    const result = getLeaderboardEntryMeta(entry, 100000, 107)
    expect(result.tooltipText).toBe('No sector data')
    expect(result.hasSplits).toBe(false)
  })
})
