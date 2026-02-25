// Effector model for syncing official presets from remote JSON with local cache fallback.

import { createEffect, createEvent, createStore, sample } from 'effector'
import { z } from 'zod'
import type { OfficialPresetEntry } from '@/shared/api/official-presets'
import {
  createOfficialPresetId,
  fetchOfficialPresets,
} from '@/shared/api/official-presets'
import {
  OFFICIAL_PRESETS_CACHE_STORAGE_KEY,
  OFFICIAL_PRESETS_SYNC_TTL_MS,
} from '@/shared/config/constants'
import type { SettingsPreset } from '@/shared/types'

type SyncStatus = 'idle' | 'success' | 'fallback' | 'error'

interface OfficialPresetsSyncResult {
  presets: OfficialPresetEntry[]
  syncedAt: number
  status: SyncStatus
}

interface CachedOfficialPresetsPayload {
  syncedAt: number
  presets: Array<{
    id: string
    preset: SettingsPreset
  }>
}

const cachedOfficialPresetsSchema = z.object({
  syncedAt: z.number(),
  presets: z.array(
    z.object({
      id: z.string(),
      preset: z.object({
        id: z.string(),
        name: z.string(),
        settings: z.object({
          serverUrl: z.string(),
          carClasses: z.array(
            z.object({
              name: z.string(),
              patterns: z.array(z.string()),
            }),
          ),
          participantsCsvUrl: z.string(),
        }),
      }),
    }),
  ),
})

// Bootstrap/user intent: sync official presets.
const officialPresetsSyncRequested = createEvent<void>()

const syncOfficialPresetsFx = createEffect(
  async (): Promise<OfficialPresetsSyncResult> => {
    const now = Date.now()
    const cached = readCachedOfficialPresets()
    if (cached && now - cached.syncedAt < OFFICIAL_PRESETS_SYNC_TTL_MS) {
      return {
        presets: cached.presets,
        syncedAt: cached.syncedAt,
        status: 'success',
      }
    }

    try {
      const presets = await fetchOfficialPresets()
      writeCachedOfficialPresets({
        presets,
        syncedAt: now,
      })

      return {
        presets,
        syncedAt: now,
        status: 'success',
      }
    } catch {
      if (cached) {
        return {
          presets: cached.presets,
          syncedAt: cached.syncedAt,
          status: 'fallback',
        }
      }

      return {
        presets: [],
        syncedAt: now,
        status: 'error',
      }
    }
  },
)

const $officialPresets = createStore<OfficialPresetEntry[]>([]).on(
  syncOfficialPresetsFx.doneData,
  (_, payload) => payload.presets,
)

const $officialPresetsSyncedAt = createStore<number | null>(null).on(
  syncOfficialPresetsFx.doneData,
  (_, payload) => payload.syncedAt,
)

const $officialPresetsSyncStatus = createStore<SyncStatus>('idle').on(
  syncOfficialPresetsFx.doneData,
  (_, payload) => payload.status,
)

const $officialPresetsLoading = syncOfficialPresetsFx.pending

sample({
  clock: officialPresetsSyncRequested,
  target: syncOfficialPresetsFx,
})

export {
  $officialPresets,
  $officialPresetsLoading,
  $officialPresetsSyncedAt,
  $officialPresetsSyncStatus,
  officialPresetsSyncRequested,
}

/**
 * Reads and validates cached official presets snapshot from localStorage.
 * @returns Parsed cache payload or null.
 */
function readCachedOfficialPresets(): CachedOfficialPresetsPayload | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const raw = localStorage.getItem(OFFICIAL_PRESETS_CACHE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = cachedOfficialPresetsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return null
    }

    const seenIds = new Set<string>()
    const normalizedPresets = parsed.data.presets
      .map((entry) => {
        const normalizedName = entry.preset.name.trim()
        if (!normalizedName) {
          return null
        }

        const baseId = createOfficialPresetId(
          entry.id || entry.preset.id || normalizedName,
        )
        if (!baseId) {
          return null
        }

        const id = createUniqueCachedPresetId(baseId, seenIds)
        return {
          id,
          preset: {
            ...entry.preset,
            id,
            name: normalizedName,
          },
        }
      })
      .filter((entry): entry is OfficialPresetEntry => entry !== null)

    return {
      syncedAt: parsed.data.syncedAt,
      presets: normalizedPresets,
    }
  } catch {
    return null
  }
}

/**
 * Returns unique cached preset id by appending numeric suffix when needed.
 * @param baseId Candidate id.
 * @param seenIds Set of already used ids.
 * @returns Unique id.
 */
function createUniqueCachedPresetId(
  baseId: string,
  seenIds: Set<string>,
): string {
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
 * Writes validated official presets into localStorage cache.
 * @param payload Cache payload.
 */
function writeCachedOfficialPresets(
  payload: CachedOfficialPresetsPayload,
): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.setItem(
      OFFICIAL_PRESETS_CACHE_STORAGE_KEY,
      JSON.stringify(payload),
    )
  } catch {
    // Ignore quota and private mode write failures.
  }
}

/**
 * Checks whether runtime localStorage API is safely usable.
 * @returns True when storage get/set methods are available.
 */
function isLocalStorageAvailable(): boolean {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function' &&
      typeof localStorage.setItem === 'function'
    )
  } catch {
    return false
  }
}
