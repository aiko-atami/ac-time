// React facade for merged official/user settings presets Effector model.
import type { PresetRef, ResolvedPreset, SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { useUnit } from 'effector-react'
import { $officialPresetsSyncStatus } from './official-presets.model'
import {
  $activePreset,
  $activePresetRef,
  $presetGroups,
  $presetItems,
  $presets,
  presetCloned,
  presetCreated,
  presetDeleted,
  presetSelected,
  presetUpdated,
} from './presets.model'

interface UseSettingsPresetsReturn {
  userPresets: SettingsPreset[]
  presetGroups: {
    official: ResolvedPreset[]
    user: ResolvedPreset[]
  }
  presetItems: ResolvedPreset[]
  activePresetRef: PresetRef | null
  activePreset: SettingsPreset | null
  officialSyncStatus: 'idle' | 'success' | 'fallback' | 'error'
  selectPreset: (presetRef: PresetRef) => void
  createNewPreset: (settings: SettingsSnapshot, name: string) => void
  updatePresetById: (presetId: string, settings: SettingsSnapshot, name: string) => void
  deletePresetById: (presetId: string) => void
  clonePresetByRef: (presetRef: PresetRef) => void
}

/**
 * Exposes merged presets state and domain actions for React components.
 * @returns Presets store slices and handlers.
 */
export function useSettingsPresets(): UseSettingsPresetsReturn {
  const {
    userPresets,
    presetGroups,
    presetItems,
    activePreset,
    activePresetRef,
    officialSyncStatus,
    selectPreset,
    createPreset,
    updatePreset,
    deletePreset,
    clonePreset,
  } = useUnit({
    userPresets: $presets,
    presetGroups: $presetGroups,
    presetItems: $presetItems,
    activePreset: $activePreset,
    activePresetRef: $activePresetRef,
    officialSyncStatus: $officialPresetsSyncStatus,
    selectPreset: presetSelected,
    createPreset: presetCreated,
    updatePreset: presetUpdated,
    deletePreset: presetDeleted,
    clonePreset: presetCloned,
  })

  return {
    userPresets,
    presetGroups,
    presetItems,
    activePreset,
    activePresetRef,
    officialSyncStatus,
    selectPreset,
    createNewPreset: (settings, name) => createPreset({ settings, name }),
    updatePresetById: (presetId, settings, name) => updatePreset({ presetId, settings, name }),
    deletePresetById: deletePreset,
    clonePresetByRef: clonePreset,
  }
}
