// Tests for settings-storage CRUD operations and normalization logic.
import type { SettingsPresetsState, SettingsSnapshot } from '@/shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PACE_PERCENT_THRESHOLD,
  DEFAULT_SERVER_URL,
} from '@/shared/config/constants'
import {
  createDefaultSettingsSnapshot,
  createPreset,
  deletePreset,
  getActivePreset,
  loadSettingsPresetsState,
  renamePreset,
  saveSettingsPresetsState,
  selectActivePreset,
  updatePresetSettings,
} from './settings-storage'

/**
 * Produces a minimal valid presets state with one preset (no localStorage dependency).
 * @param overrides Select fields to override.
 * @returns Test presets state.
 */
function createTestState(overrides: Partial<SettingsPresetsState> = {}): SettingsPresetsState {
  const snapshot = createDefaultSettingsSnapshot()
  const preset = {
    id: 'test-preset-1',
    name: 'Test',
    settings: snapshot,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return {
    version: 1,
    presets: [preset],
    activePresetId: preset.id,
    ...overrides,
  }
}

describe('createDefaultSettingsSnapshot', () => {
  it('should return snapshot with default server URL and pace threshold', () => {
    const snapshot = createDefaultSettingsSnapshot()
    expect(snapshot.serverUrl).toBe(DEFAULT_SERVER_URL)
    expect(snapshot.pacePercentThreshold).toBe(DEFAULT_PACE_PERCENT_THRESHOLD)
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

describe('updatePresetSettings', () => {
  it('should update settings of the target preset', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const newSettings: SettingsSnapshot = {
      ...createDefaultSettingsSnapshot(),
      serverUrl: 'https://new-server.test/api.json',
    }
    const result = updatePresetSettings(state, presetId, newSettings)
    const updated = result.presets.find(p => p.id === presetId)
    expect(updated?.settings.serverUrl).toBe('https://new-server.test/api.json')
  })

  it('should not mutate other presets', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const withExtra = createPreset(state, 'Other', snapshot)
    const presetId = withExtra.presets[0].id
    const otherId = withExtra.presets[1].id
    const newSettings: SettingsSnapshot = {
      ...createDefaultSettingsSnapshot(),
      serverUrl: 'https://changed.test/api.json',
    }
    const result = updatePresetSettings(withExtra, presetId, newSettings)
    const other = result.presets.find(p => p.id === otherId)
    expect(other?.settings.serverUrl).not.toBe('https://changed.test/api.json')
  })
})

describe('renamePreset', () => {
  it('should rename the target preset', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const result = renamePreset(state, presetId, 'Renamed')
    const renamed = result.presets.find(p => p.id === presetId)
    expect(renamed?.name).toBe('Renamed')
  })

  it('should trim whitespace from name', () => {
    const state = createTestState()
    const presetId = state.presets[0].id
    const result = renamePreset(state, presetId, '  Spaced  ')
    const renamed = result.presets.find(p => p.id === presetId)
    expect(renamed!.name).toBe('Spaced')
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

describe('loadSettingsPresetsState / saveSettingsPresetsState', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    })
  })

  it('should round-trip state through localStorage', () => {
    const state = createTestState()
    const snapshot = createDefaultSettingsSnapshot()
    const withExtra = createPreset(state, 'Saved Preset', snapshot)
    saveSettingsPresetsState(withExtra)
    const loaded = loadSettingsPresetsState()
    expect(loaded.presets.find(p => p.name === 'Saved Preset')).toBeDefined()
  })

  it('should return default state when localStorage is empty', () => {
    const state = loadSettingsPresetsState()
    expect(state.presets.length).toBeGreaterThanOrEqual(1)
    expect(state.activePresetId).toBeDefined()
  })
})
