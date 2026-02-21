// Fetches and validates official presets JSON from runtime-configurable remote file.
import type { CarClassRule, SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { z } from 'zod'
import { OFFICIAL_PRESETS_URL } from '@/shared/config/constants'

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

  return parsed
    .map((item) => {
      const normalizedName = normalizePresetName(item.name)
      if (!normalizedName) {
        return null
      }

      const snapshot = normalizeSnapshot(item.settings)
      return {
        id: createOfficialPresetId(normalizedName),
        preset: {
          id: createOfficialPresetId(normalizedName),
          name: normalizedName,
          settings: snapshot,
        },
      }
    })
    .filter((item): item is OfficialPresetEntry => item !== null)
}

/**
 * Builds a stable official id from preset name.
 * @param name Official preset display name.
 * @returns Lowercased stable id.
 */
export function createOfficialPresetId(name: string): string {
  return name.trim().toLowerCase()
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
 * Normalizes snapshot values to avoid malformed runtime data.
 * @param snapshot Parsed snapshot object.
 * @returns Snapshot with deduplicated class rules.
 */
function normalizeSnapshot(snapshot: z.infer<typeof settingsSnapshotSchema>): SettingsSnapshot {
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
      .map(pattern => pattern.trim())
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
