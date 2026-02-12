// @anchor: leaderboard/features/settings/model/settings-storage
// @intent: Persist settings presets and migrate legacy localStorage keys.
import type { CarClassRule, SettingsPreset, SettingsPresetsState, SettingsSnapshot } from '@/lib/types'
import {
  DEFAULT_CLASS_RULES,
  DEFAULT_PACE_PERCENT_THRESHOLD,
  DEFAULT_PARTICIPANTS_CSV_URL,
  DEFAULT_SERVER_URL,
  LEGACY_SETTINGS_PRESETS_STORAGE_KEY,
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
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
    pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
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

  const defaults = createDefaultPresetsState()
  saveSettingsPresetsState(defaults)
  return defaults
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
 * Creates initial presets state for first-time users.
 * @returns Default presets state.
 */
function createDefaultPresetsState(): SettingsPresetsState {
  return {
    version: SETTINGS_PRESETS_VERSION,
    activePresetId: '9d5388f6-2867-4cf5-801d-c883706d82c1',
    presets: [
      {
        id: '9d5388f6-2867-4cf5-801d-c883706d82c1',
        name: 'AC7 Gold',
        settings: {
          serverUrl: 'https://ac7.yoklmnracing.ru/api/live-timings/leaderboard.json',
          carClasses: [],
          participants: {
            csvUrl: 'https://github.com/aiko-atami/ac-time/releases/download/championship-537/participants-537.csv',
          },
          pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
        },
        createdAt: '2026-02-11T15:18:33.712Z',
        updatedAt: '2026-02-12T12:35:52.401Z',
      },
      {
        id: 'e4606c07-42c7-4ab1-86b9-639e1ddfd3ea',
        name: 'AC8 Bronze Silver',
        settings: {
          serverUrl: 'https://ac8.yoklmnracing.ru/api/live-timings/leaderboard.json',
          carClasses: [
            {
              name: 'Серебро',
              patterns: ['SUPER-PRODUCTION'],
            },
            {
              name: 'Бронза',
              patterns: ['LADA 2118 Concept C GT'],
            },
          ],
          participants: {
            csvUrl: 'https://github.com/aiko-atami/ac-time/releases/download/championship-537/participants-537.csv',
          },
          pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
        },
        createdAt: '2026-02-11T15:19:13.081Z',
        updatedAt: '2026-02-12T12:36:05.889Z',
      },
      {
        id: 'c1a34007-0e08-41e7-8e48-dd5312fef72d',
        name: 'AC9',
        settings: {
          serverUrl: 'https://ac9.yoklmnracing.ru/api/live-timings/leaderboard.json',
          carClasses: [],
          participants: {
            csvUrl: 'https://github.com/aiko-atami/ac-time/releases/download/championship-538/participants-538.csv',
          },
          pacePercentThreshold: DEFAULT_PACE_PERCENT_THRESHOLD,
        },
        createdAt: '2026-02-11T15:25:05.113Z',
        updatedAt: '2026-02-12T12:36:57.429Z',
      },
    ],
  }
}

/**
 * Normalizes an arbitrary state payload into a valid presets state.
 * @param value Untrusted parsed JSON value.
 * @returns Sanitized state.
 */
function normalizeState(value: unknown): SettingsPresetsState {
  const fallback = createDefaultPresetsState()
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
      csvUrl: normalizeOptionalHttpUrl(participants?.csvUrl, defaults.participants.csvUrl),
    },
    pacePercentThreshold: normalizePacePercentThreshold(source.pacePercentThreshold, defaults.pacePercentThreshold),
  }
}

/**
 * Validates pace percentage threshold value.
 * @param value Candidate threshold value.
 * @param fallback Fallback threshold.
 * @returns Valid threshold in configured range.
 */
function normalizePacePercentThreshold(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  const rounded = Math.round(value)
  if (rounded < MIN_PACE_PERCENT_THRESHOLD || rounded > MAX_PACE_PERCENT_THRESHOLD) {
    return fallback
  }

  return rounded
}

/**
 * Normalizes an optional HTTP/HTTPS URL value.
 * @param value Potential URL string.
 * @param fallback URL used for invalid non-empty values.
 * @returns Empty string, valid URL, or fallback.
 */
function normalizeOptionalHttpUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return isValidHttpUrl(trimmed) ? trimmed : fallback
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
