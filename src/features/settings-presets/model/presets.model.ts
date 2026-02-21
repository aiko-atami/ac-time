// Effector model for local user presets merged with synced official presets.
import type {
  PresetRef,
  ResolvedPreset,
  SettingsPreset,
  SettingsPresetsState,
  SettingsSnapshot,
} from '@/shared/types'
import { combine, createEvent, createStore, sample } from 'effector'
import { persist } from 'effector-storage/local'
import { SETTINGS_PRESETS_STORAGE_KEY } from '@/shared/config/constants'
import { $officialPresets } from './official-presets.model'
import {
  clonePreset,
  createDefaultPresetsState,
  createPreset,
  deletePreset,
  normalizeState,
  selectActivePresetRef,
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

// User intent: switch active preset by source-aware reference.
const presetSelected = createEvent<PresetRef>()
// User intent: create a new user preset with provided name and snapshot.
const presetCreated = createEvent<PresetCreatePayload>()
// User intent: update existing user preset fields by id.
const presetUpdated = createEvent<PresetUpsertPayload>()
// User intent: delete user preset by id (guarded in pure reducer helper).
const presetDeleted = createEvent<string>()
// User intent: clone preset by source-aware reference.
const presetCloned = createEvent<PresetRef>()
// Bootstrap intent: restore user presets state from localStorage in active app scope.
const presetsPersistencePickupRequested = createEvent<void>()

const userPresetCloneRequested = createEvent<string>()
const officialPresetCloneRequested = createEvent<PresetCreatePayload>()
const activePresetRefReconciled = createEvent<PresetRef>()

// Canonical persisted state: local user presets and selected active reference.
const $presetsState = createStore<SettingsPresetsState>(createDefaultPresetsState())
  .on(presetSelected, (state, presetRef) => selectActivePresetRef(state, presetRef))
  .on(activePresetRefReconciled, (state, presetRef) => selectActivePresetRef(state, presetRef))
  .on(presetCreated, (state, payload) => createPreset(state, payload.name, payload.settings))
  .on(officialPresetCloneRequested, (state, payload) => createPreset(state, payload.name, payload.settings))
  .on(presetUpdated, (state, payload) => updatePreset(state, payload.presetId, payload.name, payload.settings))
  .on(presetDeleted, (state, presetId) => deletePreset(state, presetId))
  .on(userPresetCloneRequested, (state, presetId) => clonePreset(state, presetId))

// Read model: local user presets only.
const $presets = $presetsState.map(state => state.presets)
// Read model: selected source-aware active preset ref.
const $activePresetRef = $presetsState.map(state => state.activePresetRef)

// Read model: official presets resolved into common UI shape.
const $officialPresetItems = $officialPresets.map(officialPresets =>
  officialPresets.map(({ id, preset }): ResolvedPreset => ({
    ref: { source: 'official', id },
    source: 'official',
    preset,
    readOnly: true,
  })),
)

// Read model: user presets resolved into common UI shape.
const $userPresetItems = $presets.map(userPresets =>
  userPresets.map((preset): ResolvedPreset => ({
    ref: { source: 'user', id: preset.id },
    source: 'user',
    preset,
    readOnly: false,
  })),
)

// Read model: grouped preset options for settings UI and selectors.
const $presetGroups = combine(
  $officialPresetItems,
  $userPresetItems,
  (official, user) => ({ official, user }),
)

// Read model: flat options preserving required order (official first, user second).
const $presetItems = combine(
  $officialPresetItems,
  $userPresetItems,
  (official, user) => [...official, ...user],
)

// Read model: resolved active preset ref with robust fallback.
const $resolvedActivePresetRef = combine(
  $activePresetRef,
  $officialPresetItems,
  $userPresetItems,
  (activePresetRef, official, user): PresetRef | null => {
    const active = resolvePresetByRef(activePresetRef, official, user)
    if (active) {
      return active.ref
    }

    return official[0]?.ref ?? user[0]?.ref ?? null
  },
)

// Read model: resolved active preset entity with fallback.
const $activePreset = combine(
  $resolvedActivePresetRef,
  $officialPresetItems,
  $userPresetItems,
  (activePresetRef, official, user): SettingsPreset | null =>
    resolvePresetByRef(activePresetRef, official, user)?.preset ?? null,
)

if (isLocalStorageAvailable()) {
  // Two-way sync: restore on init and write every user presets-state update.
  persist({
    store: $presetsState,
    key: SETTINGS_PRESETS_STORAGE_KEY,
    pickup: presetsPersistencePickupRequested,
    // Normalize persisted payload before it reaches the store to keep state shape safe.
    deserialize: value => normalizeState(JSON.parse(value)),
  })
}

sample({
  clock: presetCloned,
  filter: presetRef => presetRef.source === 'user',
  fn: presetRef => presetRef.id,
  target: userPresetCloneRequested,
})

sample({
  clock: presetCloned,
  source: $officialPresets,
  filter: (officialPresets, presetRef) =>
    presetRef.source === 'official'
    && officialPresets.some(item => item.id === presetRef.id),
  fn: (officialPresets, presetRef) => {
    const official = officialPresets.find(item => item.id === presetRef.id)!
    return {
      name: official.preset.name,
      settings: official.preset.settings,
    }
  },
  target: officialPresetCloneRequested,
})

sample({
  clock: [$officialPresetItems.updates, $presets.updates],
  source: {
    activePresetRef: $activePresetRef,
    resolvedActivePresetRef: $resolvedActivePresetRef,
  },
  filter: ({ activePresetRef, resolvedActivePresetRef }) =>
    Boolean(resolvedActivePresetRef)
    && (
      !activePresetRef
      || activePresetRef.source !== resolvedActivePresetRef!.source
      || activePresetRef.id !== resolvedActivePresetRef!.id
    ),
  fn: ({ resolvedActivePresetRef }) => resolvedActivePresetRef!,
  target: activePresetRefReconciled,
})

export {
  $activePreset,
  $activePresetRef,
  $presetGroups,
  $presetItems,
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
 * Resolves item by source-aware reference from grouped collections.
 * @param presetRef Source-aware preset ref.
 * @param official Official preset items.
 * @param user User preset items.
 * @returns Matching item or null.
 */
function resolvePresetByRef(
  presetRef: PresetRef | null,
  official: ResolvedPreset[],
  user: ResolvedPreset[],
): ResolvedPreset | null {
  if (!presetRef) {
    return null
  }

  const sourceItems = presetRef.source === 'official' ? official : user
  return sourceItems.find(item => item.ref.id === presetRef.id) ?? null
}

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
