// Tests for settings presets pure CRUD and normalization utilities.
import type { SettingsPresetsState, SettingsSnapshot } from '@/shared/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SERVER_URL } from '@/shared/config/constants'
import {
  clonePreset,
  createDefaultSettingsSnapshot,
  createPreset,
  deletePreset,
  getActivePreset,
  normalizeState,
  selectActivePreset,
  updatePreset,
} from './settings-storage'

/**
 * Produces a minimal valid presets state with one preset.
 * @param overrides Select fields to override.
 * @returns Test presets state.
 */
function createTestState(overrides: Partial<SettingsPresetsState> = {}): SettingsPresetsState {
  const snapshot = createDefaultSettingsSnapshot()
  const preset = {
    id: 'test-preset-1',
    name: 'Test',
    settings: snapshot,
  }

  return {
    version: 1,
    presets: [preset],
    activePresetId: preset.id,
    ...overrides,
  }
}

describe('createDefaultSettingsSnapshot', () => {
  it('should return snapshot with default server URL', () => {
    const snapshot = createDefaultSettingsSnapshot()
    expect(snapshot.serverUrl).toBe(DEFAULT_SERVER_URL)
    expect(snapshot.carClasses).toBeInstanceOf(Array)
    expect(snapshot.participants).toBeDefined()
  })
})

describe('selectActivePreset', () => {
  it('should set active preset to given id when preset exists', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const result = selectActivePreset(state, presetId)
    expect(result.activePresetId).toBe(presetId)
  })

  it('should keep previous active when id does not exist', () => {
    const state = createTestState()
    const prev = state.activePresetId
    const result = selectActivePreset(state, 'nonexistent-id')
    expect(result.activePresetId).toBe(prev)
  })
})

describe('createPreset', () => {
  it('should add a preset and make it active', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const result = createPreset(state, 'New Preset', snapshot)
    expect(result.presets.length).toBe(state.presets.length + 1)

    const newPreset = result.presets.find(p => p.name === 'New Preset')
    expect(newPreset).toBeDefined()
    expect(result.activePresetId).toBe(newPreset!.id)
  })
})

describe('updatePreset', () => {
  it('should update name and settings of the target preset', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const newSettings: SettingsSnapshot = {
      ...createDefaultSettingsSnapshot(),
      serverUrl: 'https://new-server.test/api.json',
    }
    const result = updatePreset(state, presetId, 'Renamed', newSettings)
    const updated = result.presets.find(p => p.id === presetId)
    expect(updated?.name).toBe('Renamed')
    expect(updated?.settings.serverUrl).toBe('https://new-server.test/api.json')
  })
})

describe('clonePreset', () => {
  it('should create a clone with (1) suffix and same settings', () => {
    const state = createTestState({
      presets: [
        {
          id: 'a',
          name: 'Race',
          settings: createDefaultSettingsSnapshot(),
        },
      ],
      activePresetId: 'a',
    })

    const result = clonePreset(state, 'a')
    expect(result.presets.length).toBe(2)

    const clone = result.presets.find(p => p.id !== 'a')
    expect(clone?.name).toBe('Race (1)')
    expect(clone?.settings).toEqual(state.presets[0].settings)
    expect(result.activePresetId).toBe('a')
  })

  it('should increment suffix when clone name already exists', () => {
    const state = createTestState({
      presets: [
        {
          id: 'a',
          name: 'Race',
          settings: createDefaultSettingsSnapshot(),
        },
        {
          id: 'b',
          name: 'Race (1)',
          settings: createDefaultSettingsSnapshot(),
        },
      ],
      activePresetId: 'a',
    })

    const result = clonePreset(state, 'a')
    const names = result.presets.map(p => p.name)
    expect(names).toContain('Race (2)')
  })
})

describe('deletePreset', () => {
  it('should remove the target preset', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const withExtra = createPreset(state, 'Extra', snapshot)
    const firstId = withExtra.presets[0].id
    const result = deletePreset(withExtra, firstId)
    expect(result.presets.find(p => p.id === firstId)).toBeUndefined()
  })

  it('should not remove the last remaining preset', () => {
    const state = createTestState()
    const result = deletePreset(state, state.presets[0].id)
    expect(result.presets.length).toBeGreaterThanOrEqual(1)
  })

  it('should switch active preset when active is deleted', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const withExtra = createPreset(state, 'Extra', snapshot)
    const activeId = withExtra.activePresetId!
    const result = deletePreset(withExtra, activeId)
    expect(result.activePresetId).not.toBe(activeId)
    expect(result.presets.find(p => p.id === result.activePresetId)).toBeDefined()
  })
})

describe('getActivePreset', () => {
  it('should return active preset when it exists', () => {
    const state = createTestState()
    const active = getActivePreset(state)
    expect(active).not.toBeNull()
    expect(active!.id).toBe(state.activePresetId)
  })

  it('should fallback to first preset when active id does not match', () => {
    const state = createTestState({ activePresetId: 'ghost-id' })
    const active = getActivePreset(state)
    expect(active).not.toBeNull()
    expect(active!.id).toBe(state.presets[0].id)
  })
})

describe('normalizeState', () => {
  it('should normalize invalid payload to default state', () => {
    const normalized = normalizeState(null)
    expect(normalized.presets.length).toBeGreaterThan(0)
    expect(normalized.activePresetId).toBeTruthy()
  })

  it('should drop invalid pacePercentThreshold legacy field from snapshots', () => {
    const normalized = normalizeState({
      version: 1,
      activePresetId: 'x',
      presets: [
        {
          id: 'x',
          name: 'Legacy',
          settings: {
            serverUrl: 'https://example.com/leaderboard.json',
            participants: { csvUrl: '' },
            carClasses: [],
            pacePercentThreshold: 113,
          },
        },
      ],
    })

    expect(normalized.presets[0].settings).not.toHaveProperty('pacePercentThreshold')
  })
})
