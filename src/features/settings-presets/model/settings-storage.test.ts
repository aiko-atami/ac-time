// Tests for settings presets pure CRUD, migration, and normalization utilities.
import type { SettingsPresetsState, SettingsSnapshot } from '@/shared/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SERVER_URL } from '@/shared/config/constants'
import {
  clonePreset,
  createDefaultSettingsSnapshot,
  createPreset,
  deletePreset,
  getActiveUserPreset,
  normalizeState,
  selectActivePresetRef,
  updatePreset,
} from './settings-storage'

/**
 * Produces a minimal valid presets state with one user preset.
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
    version: 2,
    presets: [preset],
    activePresetRef: { source: 'user', id: preset.id },
    ...overrides,
  }
}

describe('createDefaultSettingsSnapshot', () => {
  it('should return snapshot with default server URL', () => {
    const snapshot = createDefaultSettingsSnapshot()
    expect(snapshot.serverUrl).toBe(DEFAULT_SERVER_URL)
    expect(snapshot.carClasses).toBeInstanceOf(Array)
    expect(typeof snapshot.participantsCsvUrl).toBe('string')
  })
})

describe('selectActivePresetRef', () => {
  it('should set active preset to given user id when preset exists', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const result = selectActivePresetRef(state, { source: 'user', id: presetId })
    expect(result.activePresetRef).toEqual({ source: 'user', id: presetId })
  })

  it('should keep previous active when user id does not exist', () => {
    const state = createTestState()
    const prev = state.activePresetRef
    const result = selectActivePresetRef(state, { source: 'user', id: 'nonexistent-id' })
    expect(result.activePresetRef).toEqual(prev)
  })

  it('should allow selecting official ref even if it is not in user list', () => {
    const state = createTestState()
    const result = selectActivePresetRef(state, { source: 'official', id: 'ac8' })
    expect(result.activePresetRef).toEqual({ source: 'official', id: 'ac8' })
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
    expect(result.activePresetRef).toEqual({ source: 'user', id: newPreset!.id })
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
      activePresetRef: { source: 'user', id: 'a' },
    })

    const result = clonePreset(state, 'a')
    expect(result.presets.length).toBe(2)

    const clone = result.presets.find(p => p.id !== 'a')
    expect(clone?.name).toBe('Race (1)')
    expect(clone?.settings).toEqual(state.presets[0].settings)
    expect(result.activePresetRef).toEqual({ source: 'user', id: 'a' })
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

  it('should switch active preset when active user preset is deleted', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const withExtra = createPreset(state, 'Extra', snapshot)
    const activeRef = withExtra.activePresetRef!
    const result = deletePreset(withExtra, activeRef.id)
    expect(result.activePresetRef).not.toEqual(activeRef)
    expect(result.activePresetRef?.source).toBe('user')
    expect(result.presets.find(p => p.id === result.activePresetRef?.id)).toBeDefined()
  })
})

describe('getActiveUserPreset', () => {
  it('should return active user preset when it exists', () => {
    const state = createTestState()
    const active = getActiveUserPreset(state)
    expect(active).not.toBeNull()
    expect(active!.id).toBe(state.activePresetRef?.id)
  })

  it('should fallback to first preset when active ref points to missing user preset', () => {
    const state = createTestState({ activePresetRef: { source: 'user', id: 'ghost-id' } })
    const active = getActiveUserPreset(state)
    expect(active).not.toBeNull()
    expect(active!.id).toBe(state.presets[0].id)
  })
})

describe('normalizeState', () => {
  it('should normalize invalid payload to default state', () => {
    const normalized = normalizeState(null)
    expect(normalized.presets.length).toBeGreaterThan(0)
    expect(normalized.activePresetRef).toBeTruthy()
  })

  it('should migrate v1 activePresetId into activePresetRef', () => {
    const normalized = normalizeState({
      version: 1,
      activePresetId: 'x',
      presets: [
        {
          id: 'x',
          name: 'Legacy',
          settings: {
            serverUrl: 'https://example.com/leaderboard.json',
            participantsCsvUrl: '',
            carClasses: [],
            pacePercentThreshold: 113,
          },
        },
      ],
    })

    expect(normalized.activePresetRef).toEqual({ source: 'user', id: 'x' })
    expect(normalized.presets[0].settings).not.toHaveProperty('pacePercentThreshold')
  })
})
