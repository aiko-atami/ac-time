// Fetches and validates official presets JSON from runtime-configurable remote file.

import { z } from 'zod'
import { OFFICIAL_PRESETS_URL } from '@/shared/config/constants'
import type {
  CarClassRule,
  SettingsPreset,
  SettingsSnapshot,
} from '@/shared/types'

const carClassRuleSchema = z.object({
  name: z.string(),
  patterns: z.array(z.string()),
})

const settingsSnapshotSchema = z.object({
  serverUrl: z.string().url(),
  carClasses: z.array(carClassRuleSchema),
  participantsCsvUrl: z.string().url().or(z.literal('')),
})

const officialPresetSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  settings: settingsSnapshotSchema,
})

const officialPresetsSchema = z.array(officialPresetSchema)

export interface OfficialPresetEntry {
  id: string
  preset: SettingsPreset
}

/**
 * Loads official presets from the repository raw URL.
 * @returns Validated official presets with stable name-derived ids.
 */
export async function fetchOfficialPresets(): Promise<OfficialPresetEntry[]> {
  const response = await fetch(OFFICIAL_PRESETS_URL, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch official presets: ${response.status}`)
  }

  const payload = await response.json()
  const parsed = officialPresetsSchema.parse(payload)

  return buildOfficialPresetEntries(parsed)
}

/**
 * Builds normalized official preset id.
 * @param name Official preset id candidate.
 * @returns Lowercased stable id.
 */
export function createOfficialPresetId(name: string): string {
  return name.trim().toLowerCase().slice(0, 64)
}

/**
 * Converts untrusted name into trimmed preset name.
 * @param value Input name.
 * @returns Normalized name or empty string.
 */
function normalizePresetName(value: string): string {
  return value.trim().slice(0, 64)
}

/**
 * Converts untrusted preset id into normalized id.
 * @param value Input id.
 * @returns Normalized id or empty string.
 */
function normalizePresetId(value: string): string {
  return createOfficialPresetId(value)
}

/**
 * Builds validated official entries and guarantees unique ids.
 * @param presets Parsed remote presets.
 * @returns Normalized official preset entries.
 */
function buildOfficialPresetEntries(
  presets: z.infer<typeof officialPresetsSchema>,
): OfficialPresetEntry[] {
  const seenIds = new Set<string>()
  const output: OfficialPresetEntry[] = []

  for (const item of presets) {
    const normalizedName = normalizePresetName(item.name)
    if (!normalizedName) {
      continue
    }

    const normalizedId = normalizePresetId(item.id ?? normalizedName)
    if (!normalizedId) {
      continue
    }

    const uniqueId = createUniquePresetId(normalizedId, seenIds)
    const snapshot = normalizeSnapshot(item.settings)
    output.push({
      id: uniqueId,
      preset: {
        id: uniqueId,
        name: normalizedName,
        settings: snapshot,
      },
    })
  }

  return output
}

/**
 * Returns a deterministic unique id by appending numeric suffix.
 * @param baseId Candidate id.
 * @param seenIds Set of already reserved ids.
 * @returns Unique id.
 */
function createUniquePresetId(baseId: string, seenIds: Set<string>): string {
  if (!seenIds.has(baseId)) {
    seenIds.add(baseId)
    return baseId
  }

  let counter = 2
  while (seenIds.has(`${baseId}-${counter}`)) {
    counter += 1
  }

  const uniqueId = `${baseId}-${counter}`
  seenIds.add(uniqueId)
  return uniqueId
}

/**
 * Normalizes snapshot values to avoid malformed runtime data.
 * @param snapshot Parsed snapshot object.
 * @returns Snapshot with deduplicated class rules.
 */
function normalizeSnapshot(
  snapshot: z.infer<typeof settingsSnapshotSchema>,
): SettingsSnapshot {
  return {
    serverUrl: snapshot.serverUrl.trim(),
    participantsCsvUrl: snapshot.participantsCsvUrl.trim(),
    carClasses: dedupeCarClassRules(snapshot.carClasses),
  }
}

/**
 * Dedupe and sanitize car class rules by case-insensitive class name/pattern.
 * @param rules Source class rules.
 * @returns Normalized class rules list.
 */
function dedupeCarClassRules(rules: CarClassRule[]): CarClassRule[] {
  const seenNames = new Set<string>()
  const output: CarClassRule[] = []

  for (const rule of rules) {
    const normalizedName = rule.name.trim()
    if (!normalizedName) {
      continue
    }

    const nameKey = normalizedName.toLowerCase()
    if (seenNames.has(nameKey)) {
      continue
    }
    seenNames.add(nameKey)

    const seenPatterns = new Set<string>()
    const patterns = rule.patterns
      .map((pattern) => pattern.trim())
      .filter((pattern) => {
        if (!pattern) {
          return false
        }
        const key = pattern.toLowerCase()
        if (seenPatterns.has(key)) {
          return false
        }
        seenPatterns.add(key)
        return true
      })

    output.push({
      name: normalizedName,
      patterns: patterns.length > 0 ? patterns : [normalizedName],
    })
  }

  return output
}
