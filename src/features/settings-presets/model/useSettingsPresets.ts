// React facade for settings presets Effector model.
import type { SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { useUnit } from 'effector-react'
import {
  $activePreset,
  $activePresetId,
  $presets,
  presetCloned,
  presetCreated,
  presetDeleted,
  presetSelected,
  presetUpdated,
} from './presets.model'

interface UseSettingsPresetsReturn {
  presets: SettingsPreset[]
  activePresetId: string | null
  activePreset: SettingsPreset | null
  selectPreset: (presetId: string) => void
  createNewPreset: (settings: SettingsSnapshot, name: string) => void
  updatePresetById: (presetId: string, settings: SettingsSnapshot, name: string) => void
  deletePresetById: (presetId: string) => void
  clonePresetById: (presetId: string) => void
}

/**
 * Exposes presets state and domain actions for React components.
 * @returns Presets store slice and handlers.
 */
export function useSettingsPresets(): UseSettingsPresetsReturn {
  const {
    presets,
    activePreset,
    activePresetId,
    selectPreset,
    createPreset,
    updatePreset,
    deletePreset,
    clonePreset,
  } = useUnit({
    presets: $presets,
    activePreset: $activePreset,
    activePresetId: $activePresetId,
    selectPreset: presetSelected,
    createPreset: presetCreated,
    updatePreset: presetUpdated,
    deletePreset: presetDeleted,
    clonePreset: presetCloned,
  })

  return {
    presets,
    activePreset,
    activePresetId,
    selectPreset,
    createNewPreset: (settings, name) => createPreset({ settings, name }),
    updatePresetById: (presetId, settings, name) => updatePreset({ presetId, settings, name }),
    deletePresetById: deletePreset,
    clonePresetById: clonePreset,
  }
}
