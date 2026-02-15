// @anchor: leaderboard/features/settings/model/use-settings-presets
// @intent: React hook that exposes preset CRUD and active settings state.
import type { SettingsPreset, SettingsSnapshot } from '@/shared/types'
import { useMemo, useState } from 'react'
import {
  createPreset,
  deletePreset,
  getActivePreset,
  loadSettingsPresetsState,
  renamePreset,
  saveSettingsPresetsState,
  selectActivePreset,
  updatePresetSettings,
} from './settings-storage'

interface UseSettingsPresetsReturn {
  presets: SettingsPreset[]
  activePresetId: string | null
  activePreset: SettingsPreset | null
  selectPreset: (presetId: string) => void
  createNewPreset: (settings: SettingsSnapshot, name?: string) => void
  renamePresetById: (presetId: string, name: string) => void
  deletePresetById: (presetId: string) => void
  savePresetSettingsById: (presetId: string, settings: SettingsSnapshot) => void
}

/**
 * Manages settings presets with localStorage persistence.
 * @returns Preset state and mutation callbacks.
 */
export function useSettingsPresets(): UseSettingsPresetsReturn {
  const [state, setState] = useState(loadSettingsPresetsState)

  /**
   * Commits state update and persists it in localStorage.
   * @param updater State updater function.
   */
  const commitState = (updater: (current: ReturnType<typeof loadSettingsPresetsState>) => ReturnType<typeof loadSettingsPresetsState>) => {
    setState((current) => {
      const next = updater(current)
      saveSettingsPresetsState(next)
      return next
    })
  }

  /**
   * Selects active preset.
   * @param presetId Target preset id.
   */
  const selectPreset = (presetId: string) => {
    commitState(current => selectActivePreset(current, presetId))
  }

  /**
   * Creates a new preset and activates it.
   * @param settings Snapshot for the new preset.
   * @param name Optional preset name.
   */
  const createNewPreset = (settings: SettingsSnapshot, name = '') => {
    commitState((current) => {
      const resolvedName = name.trim() || `Preset ${current.presets.length + 1}`
      return createPreset(current, resolvedName, settings)
    })
  }

  /**
   * Renames a specific preset.
   * @param presetId Target preset id.
   * @param name New preset name.
   */
  const renamePresetById = (presetId: string, name: string) => {
    commitState(current => renamePreset(current, presetId, name))
  }

  /**
   * Deletes a specific preset.
   * @param presetId Target preset id.
   */
  const deletePresetById = (presetId: string) => {
    commitState(current => deletePreset(current, presetId))
  }

  /**
   * Saves settings to a specific preset.
   * @param presetId Target preset id.
   * @param settings Settings snapshot to persist.
   */
  const savePresetSettingsById = (presetId: string, settings: SettingsSnapshot) => {
    commitState(current => updatePresetSettings(current, presetId, settings))
  }

  const activePreset = useMemo(() => getActivePreset(state), [state])

  return {
    presets: state.presets,
    activePresetId: state.activePresetId,
    activePreset,
    selectPreset,
    createNewPreset,
    renamePresetById,
    deletePresetById,
    savePresetSettingsById,
  }
}
