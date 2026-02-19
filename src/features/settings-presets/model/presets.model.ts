// Effector model for settings presets with localStorage persistence.
import type { SettingsPreset, SettingsPresetsState, SettingsSnapshot } from '@/shared/types'
import { createEvent, createStore } from 'effector'
import { persist } from 'effector-storage/local'
import { SETTINGS_PRESETS_STORAGE_KEY } from '@/shared/config/constants'
import {
  clonePreset,
  createDefaultPresetsState,
  createPreset,
  deletePreset,
  getActivePreset,
  normalizeState,
  selectActivePreset,
  updatePreset,
} from './settings-storage'

interface PresetUpsertPayload {
  presetId: string
  name: string
  settings: SettingsSnapshot
}

interface PresetCreatePayload {
  name: string
  settings: SettingsSnapshot
}

// User intent: switch active preset by id from settings UI.
const presetSelected = createEvent<string>()
// User intent: create a new preset with provided name and snapshot.
const presetCreated = createEvent<PresetCreatePayload>()
// User intent: update existing preset fields by id.
const presetUpdated = createEvent<PresetUpsertPayload>()
// User intent: delete preset by id (guarded in pure reducer helper).
const presetDeleted = createEvent<string>()
// User intent: clone preset by id with auto-generated unique clone name.
const presetCloned = createEvent<string>()
// Bootstrap intent: restore presets state from localStorage in active app scope.
const presetsPersistencePickupRequested = createEvent<void>()

// Canonical feature state: version, active preset id, and presets collection.
const $presetsState = createStore<SettingsPresetsState>(createDefaultPresetsState())
  .on(presetSelected, (state, presetId) => selectActivePreset(state, presetId))
  .on(presetCreated, (state, payload) => createPreset(state, payload.name, payload.settings))
  .on(presetUpdated, (state, payload) => updatePreset(state, payload.presetId, payload.name, payload.settings))
  .on(presetDeleted, (state, presetId) => deletePreset(state, presetId))
  .on(presetCloned, (state, presetId) => clonePreset(state, presetId))

// Read model: plain presets list for rendering management cards and select options.
const $presets = $presetsState.map(state => state.presets)
// Read model: currently selected preset id.
const $activePresetId = $presetsState.map(state => state.activePresetId)
// Read model: resolved active preset entity with fallback to first available preset.
const $activePreset = $presetsState.map(state => getActivePreset(state))

if (isLocalStorageAvailable()) {
  // Two-way sync: restore on init and write every presets-state update.
  persist({
    store: $presetsState,
    key: SETTINGS_PRESETS_STORAGE_KEY,
    pickup: presetsPersistencePickupRequested,
    // Normalize persisted payload before it reaches the store to keep state shape safe.
    deserialize: value => normalizeState(JSON.parse(value)),
  })
}

export {
  $activePreset,
  $activePresetId,
  $presets,
  $presetsState,
  presetCloned,
  presetCreated,
  presetDeleted,
  presetSelected,
  presetsPersistencePickupRequested,
  presetUpdated,
}

export type { PresetCreatePayload, PresetUpsertPayload, SettingsPreset }

/**
 * Checks whether runtime localStorage API is safely usable.
 * @returns True when storage get/set methods are available.
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined'
      && typeof localStorage.getItem === 'function'
      && typeof localStorage.setItem === 'function'
  }
  catch {
    return false
  }
}
