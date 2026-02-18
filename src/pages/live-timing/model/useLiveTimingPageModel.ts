// View-model for the live timing page that centralizes data orchestration outside UI components.
import type { ProcessedEntry } from '@/shared/types'
import { useMemo } from 'react'
import { useSettingsPresets } from '@/features/settings-presets'
import { DEFAULT_PACE_PERCENT_THRESHOLD, DEFAULT_REFRESH_INTERVAL } from '@/shared/config/constants'
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
  pacePercentThreshold: number
  isRegistered: (entry: ProcessedEntry) => boolean
}

/**
 * Collects and derives all data needed by the live timing page view.
 * @returns Consolidated page view-model.
 */
export function useLiveTimingPageModel(): UseLiveTimingPageModelReturn {
  const presets = useSettingsPresets()

  const activeSettings = presets.activePreset?.settings ?? null
  const enableClassGrouping = (activeSettings?.carClasses.length ?? 0) > 0
  const enableParticipantsFiltering = Boolean(activeSettings?.participants.csvUrl.trim())

  const { isRegistered } = useChampionshipParticipants({
    participantsCsvUrl: activeSettings?.participants.csvUrl,
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
  } = useLeaderboardFilters(
    data?.leaderboard ?? EMPTY_LEADERBOARD_ENTRIES,
    isRegistered,
    enableClassGrouping,
    enableParticipantsFiltering,
  )

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
    pacePercentThreshold: activeSettings?.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD,
    isRegistered,
  }
}
