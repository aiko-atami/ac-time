// Tests for official presets sync model: remote fetch, TTL cache, and fallback behavior.
import { allSettled, fork } from 'effector'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OFFICIAL_PRESETS_CACHE_STORAGE_KEY,
  OFFICIAL_PRESETS_SYNC_TTL_MS,
} from '@/shared/config/constants'

interface StorageMock extends Storage {
  dump: () => Record<string, string>
}

/**
 * Creates localStorage mock with in-memory backing map and spy wrappers.
 * @returns Storage mock instance.
 */
function createLocalStorageMock(): StorageMock {
  const map = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key)
    }),
    clear: vi.fn(() => {
      map.clear()
    }),
    key: vi.fn((index: number) => {
      const keys = [...map.keys()]
      return keys[index] ?? null
    }),
    get length() {
      return map.size
    },
    dump: () => Object.fromEntries(map.entries()),
  } as StorageMock
}

describe('official-presets.model', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads and caches official presets on successful fetch', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      {
        name: 'AC10',
        settings: {
          serverUrl: 'https://example.test/leaderboard.json',
          participantsCsvUrl: '',
          carClasses: [],
        },
      },
    ]), { status: 200 })))

    const model = await import('./official-presets.model')
    const scope = fork()
    await allSettled(model.officialPresetsSyncRequested, { scope })

    const presets = scope.getState(model.$officialPresets)
    expect(presets.length).toBe(1)
    expect(presets[0].id).toBe('ac10')
    expect(scope.getState(model.$officialPresetsSyncStatus)).toBe('success')
    expect(localStorage.getItem(OFFICIAL_PRESETS_CACHE_STORAGE_KEY)).not.toBeNull()
  })

  it('uses stale cache as fallback when fetch fails', async () => {
    const staleTime = Date.now() - OFFICIAL_PRESETS_SYNC_TTL_MS - 5000
    localStorage.setItem(OFFICIAL_PRESETS_CACHE_STORAGE_KEY, JSON.stringify({
      syncedAt: staleTime,
      presets: [
        {
          id: 'cached',
          preset: {
            id: 'cached',
            name: 'Cached',
            settings: {
              serverUrl: 'https://cached.test/leaderboard.json',
              participantsCsvUrl: '',
              carClasses: [],
            },
          },
        },
      ],
    }))

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network')
    }))

    const model = await import('./official-presets.model')
    const scope = fork()
    await allSettled(model.officialPresetsSyncRequested, { scope })

    const presets = scope.getState(model.$officialPresets)
    expect(presets.length).toBe(1)
    expect(presets[0].preset.name).toBe('Cached')
    expect(scope.getState(model.$officialPresetsSyncStatus)).toBe('fallback')
  })
})
