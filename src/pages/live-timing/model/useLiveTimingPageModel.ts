// View-model for the live timing page that centralizes data orchestration outside UI components.

import { useMemo } from 'react'
import { useSettingsPresets } from '@/features/settings-presets'
import { useSettingsThreshold } from '@/features/settings-threshold'
import { DEFAULT_REFRESH_INTERVAL } from '@/shared/config/constants'
import type { PresetRef, ProcessedEntry } from '@/shared/types'
import { useChampionshipParticipants } from './championship-participants/useChampionshipParticipants'
import { useLeaderboardFilters } from './leaderboard/useLeaderboardFilters'
import { useLeaderboard } from './useLeaderboard'

const EMPTY_LEADERBOARD_ENTRIES: ProcessedEntry[] = []

interface UseLiveTimingPageModelReturn {
  data: ReturnType<typeof useLeaderboard>['data']
  loading: ReturnType<typeof useLeaderboard>['loading']
  error: ReturnType<typeof useLeaderboard>['error']
  filtered: ProcessedEntry[]
  classes: string[]
  selectedClass: string
  setSelectedClass: (value: string) => void
  sortBy: 'lapTime' | 'driver' | 'laps'
  setSortBy: (value: 'lapTime' | 'driver' | 'laps') => void
  sortAsc: boolean
  toggleSortDirection: () => void
  showRegisteredOnly: boolean
  setShowRegisteredOnly: (value: boolean) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  pacePercentThreshold: number
  isRegistered: (entry: ProcessedEntry) => boolean
  activePresetName: string
  activePresetValue: string | undefined
  officialPresetOptions: Array<{ value: string; label: string }>
  userPresetOptions: Array<{ value: string; label: string }>
  setActivePresetValue: (value: string | null) => void
}

/**
 * Collects and derives all data needed by the live timing page view.
 * @returns Consolidated page view-model.
 */
export function useLiveTimingPageModel(): UseLiveTimingPageModelReturn {
  const presets = useSettingsPresets()
  const threshold = useSettingsThreshold()

  const activeSettings = presets.activePreset?.settings ?? null
  const enableClassGrouping = (activeSettings?.carClasses.length ?? 0) > 0
  const enableParticipantsFiltering = Boolean(
    activeSettings?.participantsCsvUrl.trim(),
  )

  const { isRegistered } = useChampionshipParticipants({
    participantsCsvUrl: activeSettings?.participantsCsvUrl,
    matchByDriverNameOnly: !enableClassGrouping,
  })

  const classRules = useMemo(
    () => activeSettings?.carClasses,
    [activeSettings?.carClasses],
  )

  const { data, loading, error } = useLeaderboard({
    serverUrl: activeSettings?.serverUrl,
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    classRules,
  })

  const {
    filtered,
    classes,
    selectedClass,
    setSelectedClass,
    sortBy,
    setSortBy,
    sortAsc,
    toggleSortDirection,
    showRegisteredOnly,
    setShowRegisteredOnly,
    searchQuery,
    setSearchQuery,
  } = useLeaderboardFilters(
    data?.leaderboard ?? EMPTY_LEADERBOARD_ENTRIES,
    isRegistered,
    enableClassGrouping,
    enableParticipantsFiltering,
  )

  const activePresetName = useMemo(
    () =>
      presets.presetItems.find((item) =>
        presetRefEquals(item.ref, presets.activePresetRef),
      )?.preset.name ?? 'Select preset',
    [presets.activePresetRef, presets.presetItems],
  )

  const activePresetValue =
    serializePresetRef(presets.activePresetRef) ?? undefined
  const officialPresetOptions = presets.presetGroups.official.map((item) => ({
    value: serializePresetRef(item.ref)!,
    label: item.preset.name,
  }))
  const userPresetOptions = presets.presetGroups.user.map((item) => ({
    value: serializePresetRef(item.ref)!,
    label: item.preset.name,
  }))

  const setActivePresetValue = (value: string | null) => {
    const presetRef = parsePresetRef(value)
    if (presetRef) {
      presets.selectPreset(presetRef)
    }
  }

  return {
    data,
    loading,
    error,
    filtered,
    classes,
    selectedClass,
    setSelectedClass,
    sortBy,
    setSortBy,
    sortAsc,
    toggleSortDirection,
    showRegisteredOnly,
    setShowRegisteredOnly,
    searchQuery,
    setSearchQuery,
    pacePercentThreshold: threshold.pacePercentThreshold,
    isRegistered,
    activePresetName,
    activePresetValue,
    officialPresetOptions,
    userPresetOptions,
    setActivePresetValue,
  }
}

/**
 * Serializes source-aware preset ref for Select value field.
 * @param presetRef Source-aware preset ref.
 * @returns String value or null.
 */
function serializePresetRef(presetRef: PresetRef | null): string | null {
  if (!presetRef) {
    return null
  }

  return `${presetRef.source}:${presetRef.id}`
}

/**
 * Parses Select value into source-aware preset ref.
 * @param value Select value.
 * @returns Parsed preset ref or null.
 */
function parsePresetRef(value: string | null): PresetRef | null {
  if (!value) {
    return null
  }

  const [source, ...idParts] = value.split(':')
  const id = idParts.join(':').trim()
  if (!id || (source !== 'official' && source !== 'user')) {
    return null
  }

  return { source, id }
}

/**
 * Checks whether two source-aware references are equal.
 * @param left Left ref.
 * @param right Right ref.
 * @returns True when source and id are equal.
 */
function presetRefEquals(
  left: PresetRef | null,
  right: PresetRef | null,
): boolean {
  if (!left || !right) {
    return false
  }

  return left.source === right.source && left.id === right.id
}
