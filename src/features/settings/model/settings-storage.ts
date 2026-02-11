// @anchor: leaderboard/features/settings/model/settings-storage
// @intent: Persist settings presets and migrate legacy localStorage keys.
import type { CarClassRule, SettingsPreset, SettingsPresetsState, SettingsSnapshot } from '@/lib/types'
import {
  DEFAULT_CLASS_RULES,
  DEFAULT_PARTICIPANTS_CSV_URL,
  DEFAULT_SERVER_URL,
  DEFAULT_SETTINGS_PRESET_NAME,
  LEGACY_CAR_CLASSES_KEY,
  LEGACY_PARTICIPANTS_CSV_URL_KEY,
  LEGACY_SERVER_URL_KEY,
  LEGACY_SETTINGS_PRESETS_STORAGE_KEY,
  SETTINGS_PRESETS_STORAGE_KEY,
} from '@/lib/constants'
import { dedupeCarClassRules } from './serialize'

const SETTINGS_PRESETS_VERSION = 1 as const

/**
 * Creates a default settings snapshot.
 * @returns Initial settings snapshot.
 */
export function createDefaultSettingsSnapshot(): SettingsSnapshot {
  return {
    serverUrl: DEFAULT_SERVER_URL,
    carClasses: [...DEFAULT_CLASS_RULES],
    participants: {
      csvUrl: DEFAULT_PARTICIPANTS_CSV_URL,
    },
  }
}

/**
 * Loads presets state from localStorage, including legacy migration.
 * @returns Valid presets state.
 */
export function loadSettingsPresetsState(): SettingsPresetsState {
  const raw = localStorage.getItem(SETTINGS_PRESETS_STORAGE_KEY)
    ?? localStorage.getItem(LEGACY_SETTINGS_PRESETS_STORAGE_KEY)
  if (raw) {
    const parsed = safeParseJson(raw)
    if (parsed) {
      const normalized = normalizeState(parsed)
      if (normalized.presets.length > 0) {
        saveSettingsPresetsState(normalized)
        return normalized
      }
    }
  }

  const migrated = migrateLegacyState()
  saveSettingsPresetsState(migrated)
  return migrated
}

/**
 * Saves presets state to localStorage.
 * @param state Presets state.
 */
export function saveSettingsPresetsState(state: SettingsPresetsState): void {
  localStorage.setItem(SETTINGS_PRESETS_STORAGE_KEY, JSON.stringify(state))
}

/**
 * Selects active preset by id.
 * @param state Source state.
 * @param presetId Target preset id.
 * @returns Updated state with active preset id.
 */
export function selectActivePreset(state: SettingsPresetsState, presetId: string): SettingsPresetsState {
  const exists = state.presets.some(preset => preset.id === presetId)
  if (!exists) {
    return state
  }

  return {
    ...state,
    activePresetId: presetId,
  }
}

/**
 * Creates a new preset and makes it active.
 * @param state Source state.
 * @param name User-visible preset name.
 * @param settings Preset settings payload.
 * @returns Updated state.
 */
export function createPreset(
  state: SettingsPresetsState,
  name: string,
  settings: SettingsSnapshot,
): SettingsPresetsState {
  const now = new Date().toISOString()
  const preset: SettingsPreset = {
    id: createPresetId(),
    name: normalizePresetName(name),
    settings: normalizeSnapshot(settings),
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...state,
    presets: [...state.presets, preset],
    activePresetId: preset.id,
  }
}

/**
 * Updates settings of an existing preset.
 * @param state Source state.
 * @param presetId Preset id.
 * @param settings New settings.
 * @returns Updated state.
 */
export function updatePresetSettings(
  state: SettingsPresetsState,
  presetId: string,
  settings: SettingsSnapshot,
): SettingsPresetsState {
  const now = new Date().toISOString()
  return {
    ...state,
    presets: state.presets.map((preset) => {
      if (preset.id !== presetId) {
        return preset
      }

      return {
        ...preset,
        settings: normalizeSnapshot(settings),
        updatedAt: now,
      }
    }),
  }
}

/**
 * Renames a preset.
 * @param state Source state.
 * @param presetId Preset id.
 * @param name New display name.
 * @returns Updated state.
 */
export function renamePreset(
  state: SettingsPresetsState,
  presetId: string,
  name: string,
): SettingsPresetsState {
  const now = new Date().toISOString()
  const normalizedName = normalizePresetName(name)

  return {
    ...state,
    presets: state.presets.map((preset) => {
      if (preset.id !== presetId) {
        return preset
      }

      return {
        ...preset,
        name: normalizedName,
        updatedAt: now,
      }
    }),
  }
}

/**
 * Deletes a preset by id while preserving at least one preset.
 * @param state Source state.
 * @param presetId Preset id.
 * @returns Updated state.
 */
export function deletePreset(state: SettingsPresetsState, presetId: string): SettingsPresetsState {
  if (state.presets.length <= 1) {
    return state
  }

  const presets = state.presets.filter(preset => preset.id !== presetId)
  if (presets.length === state.presets.length) {
    return state
  }

  const activePresetId = state.activePresetId === presetId
    ? presets[0]?.id ?? null
    : state.activePresetId

  return {
    ...state,
    presets,
    activePresetId,
  }
}

/**
 * Returns active preset from state.
 * @param state Presets state.
 * @returns Active preset or null.
 */
export function getActivePreset(state: SettingsPresetsState): SettingsPreset | null {
  const active = state.presets.find(preset => preset.id === state.activePresetId)
  return active ?? state.presets[0] ?? null
}

/**
 * Parses arbitrary JSON safely.
 * @param raw JSON source string.
 * @returns Parsed value or null.
 */
function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown
  }
  catch {
    return null
  }
}

/**
 * Migrates legacy storage keys into the presets schema.
 * @returns Migrated state with one default preset.
 */
function migrateLegacyState(): SettingsPresetsState {
  const legacyServerUrl = localStorage.getItem(LEGACY_SERVER_URL_KEY)
  const legacyCarClassesRaw = localStorage.getItem(LEGACY_CAR_CLASSES_KEY)
  const legacyParticipantsCsvUrl = localStorage.getItem(LEGACY_PARTICIPANTS_CSV_URL_KEY)

  const legacyCarClasses = parseLegacyCarClasses(legacyCarClassesRaw)
  const snapshot: SettingsSnapshot = {
    serverUrl: isValidHttpUrl(legacyServerUrl) ? legacyServerUrl : DEFAULT_SERVER_URL,
    carClasses: legacyCarClasses,
    participants: {
      csvUrl: isValidHttpUrl(legacyParticipantsCsvUrl)
        ? legacyParticipantsCsvUrl
        : DEFAULT_PARTICIPANTS_CSV_URL,
    },
  }

  const now = new Date().toISOString()
  const preset: SettingsPreset = {
    id: createPresetId(),
    name: DEFAULT_SETTINGS_PRESET_NAME,
    settings: snapshot,
    createdAt: now,
    updatedAt: now,
  }

  return {
    version: SETTINGS_PRESETS_VERSION,
    activePresetId: preset.id,
    presets: [preset],
  }
}

/**
 * Normalizes an arbitrary state payload into a valid presets state.
 * @param value Untrusted parsed JSON value.
 * @returns Sanitized state.
 */
function normalizeState(value: unknown): SettingsPresetsState {
  const fallback = migrateLegacyState()
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const source = value as Partial<SettingsPresetsState>
  const rawPresets = Array.isArray(source.presets) ? source.presets : []
  const presets = rawPresets
    .map(item => normalizePreset(item))
    .filter((item): item is SettingsPreset => item !== null)

  if (presets.length === 0) {
    return fallback
  }

  const activePresetId = typeof source.activePresetId === 'string'
    && presets.some(preset => preset.id === source.activePresetId)
    ? source.activePresetId
    : presets[0].id

  return {
    version: SETTINGS_PRESETS_VERSION,
    activePresetId,
    presets,
  }
}

/**
 * Converts an untrusted preset payload into a valid preset.
 * @param value Untrusted preset value.
 * @returns Normalized preset or null.
 */
function normalizePreset(value: unknown): SettingsPreset | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const source = value as Partial<SettingsPreset>
  const now = new Date().toISOString()
  const id = typeof source.id === 'string' && source.id.trim()
    ? source.id
    : createPresetId()

  return {
    id,
    name: normalizePresetName(source.name),
    settings: normalizeSnapshot(source.settings),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : now,
  }
}

/**
 * Ensures snapshot fields are valid.
 * @param snapshot Untrusted snapshot value.
 * @returns Normalized snapshot.
 */
function normalizeSnapshot(snapshot: unknown): SettingsSnapshot {
  const defaults = createDefaultSettingsSnapshot()
  if (!snapshot || typeof snapshot !== 'object') {
    return defaults
  }

  const source = snapshot as Partial<SettingsSnapshot>
  const participants = source.participants

  return {
    serverUrl: isValidHttpUrl(source.serverUrl) ? source.serverUrl : defaults.serverUrl,
    carClasses: normalizeCarClasses(source.carClasses),
    participants: {
      csvUrl: isValidHttpUrl(participants?.csvUrl)
        ? participants.csvUrl
        : defaults.participants.csvUrl,
    },
  }
}

/**
 * Parses and normalizes legacy class rules.
 * @param raw Legacy JSON string.
 * @returns Car class rules.
 */
function parseLegacyCarClasses(raw: string | null): CarClassRule[] {
  if (!raw) {
    return [...DEFAULT_CLASS_RULES]
  }

  const parsed = safeParseJson(raw)
  return normalizeCarClasses(parsed)
}

/**
 * Normalizes class rules array.
 * @param value Untrusted class rules value.
 * @returns Valid class rules. Empty array means class grouping is disabled.
 */
function normalizeCarClasses(value: unknown): CarClassRule[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_CLASS_RULES]
  }

  const rawRules = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Partial<CarClassRule>
      return {
        name: typeof source.name === 'string' ? source.name : '',
        patterns: Array.isArray(source.patterns)
          ? source.patterns.filter((pattern): pattern is string => typeof pattern === 'string')
          : [],
      }
    })
    .filter((item): item is CarClassRule => item !== null)

  const normalized = dedupeCarClassRules(rawRules)
  return normalized
}

/**
 * Validates HTTP/HTTPS URL values.
 * @param value Potential URL string.
 * @returns True when value is a valid HTTP(S) URL.
 */
function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) {
    return false
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

/**
 * Produces a normalized preset display name.
 * @param value Name input.
 * @returns Trimmed non-empty preset name.
 */
function normalizePresetName(value: unknown): string {
  if (typeof value !== 'string') {
    return 'Preset'
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return 'Preset'
  }

  return trimmed.slice(0, 64)
}

/**
 * Creates a unique preset id.
 * @returns Preset id value.
 */
function createPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
