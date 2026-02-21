// Integration tests for presets model persistence behavior with localStorage adapter.
import { allSettled, fork } from 'effector'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTINGS_PRESETS_STORAGE_KEY } from '@/shared/config/constants'

interface StorageMock extends Storage {
  dump: () => Record<string, string>
}

/**
 * Creates localStorage mock with in-memory backing map and spy wrappers.
 * @returns Storage mock instance.
 */
function createLocalStorageMock(): StorageMock {
  const map = new Map<string, string>()

  const storage = {
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

  return storage
}

describe('presets.model persistence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists cloned preset to localStorage key', async () => {
    const model = await import('./presets.model')
    const scope = fork()
    const initialState = scope.getState(model.$presetsState)
    const sourcePresetId = initialState.presets[0]?.id

    expect(sourcePresetId).toBeDefined()

    await allSettled(model.presetCloned, {
      scope,
      params: { source: 'user', id: sourcePresetId! },
    })

    const persistedRaw = localStorage.getItem(SETTINGS_PRESETS_STORAGE_KEY)
    expect(persistedRaw).not.toBeNull()

    const persistedState = JSON.parse(persistedRaw!)
    expect(persistedState.presets.length).toBe(initialState.presets.length + 1)
    expect(persistedState.presets.some((preset: { name: string }) => /\(\d+\)$/.test(preset.name))).toBe(true)
  })

  it('clones official preset into user presets', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      {
        name: 'Official AC',
        settings: {
          serverUrl: 'https://official.test/leaderboard.json',
          participantsCsvUrl: '',
          carClasses: [],
        },
      },
    ]), { status: 200 })))

    const model = await import('./presets.model')
    const officialModel = await import('./official-presets.model')
    const scope = fork()

    await allSettled(officialModel.officialPresetsSyncRequested, { scope })
    await allSettled(model.presetCloned, {
      scope,
      params: { source: 'official', id: 'official ac' },
    })

    const state = scope.getState(model.$presetsState)
    expect(state.presets.some(preset => preset.name === 'Official AC')).toBe(true)
    expect(state.activePresetRef?.source).toBe('user')
  })
})
