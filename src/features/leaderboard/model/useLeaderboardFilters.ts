// @anchor: leaderboard/features/leaderboard/model/use-leaderboard-filters
// @intent: Provide client-side class/registration filters and sorting for leaderboard entries.
import type { ProcessedEntry } from '@/lib/types'
import { useMemo, useState } from 'react'

type SortField = 'lapTime' | 'driver' | 'laps'

interface UseLeaderboardFiltersReturn {
  filtered: ProcessedEntry[]
  classes: string[]
  selectedClass: string
  setSelectedClass: (value: string) => void
  sortBy: SortField
  setSortBy: (value: SortField) => void
  sortAsc: boolean
  setSortAsc: (value: boolean) => void
  toggleSortDirection: () => void
  showRegisteredOnly: boolean
  setShowRegisteredOnly: (value: boolean) => void
}

/**
 * Custom hook for filtering and sorting leaderboard data
 * Handles car class filtering and multi-field sorting
 */
export function useLeaderboardFilters(
  entries: ProcessedEntry[],
  isRegistered: (entry: ProcessedEntry) => boolean,
  enableClassGrouping = true,
  enableParticipantsFiltering = true,
): UseLeaderboardFiltersReturn {
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortField>('lapTime')
  const [sortAsc, setSortAsc] = useState(true)
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false)

  // Get unique car classes
  const classes = useMemo(() => {
    if (!enableClassGrouping) {
      return ['All']
    }

    const uniqueClasses = new Set(entries.map(e => e.carClass))
    return ['All', ...Array.from(uniqueClasses)]
  }, [entries, enableClassGrouping])

  const effectiveSelectedClass = enableClassGrouping ? selectedClass : 'All'

  // Filter and sort data
  const filtered = useMemo(() => {
    let result = [...entries]

    // Filter by class
    if (enableClassGrouping && effectiveSelectedClass !== 'All') {
      result = result.filter(e => e.carClass === effectiveSelectedClass)
    }

    // Filter by registered only
    if (showRegisteredOnly && enableParticipantsFiltering) {
      result = result.filter(e => isRegistered(e))
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'lapTime':
          if (a.bestLap === null && b.bestLap === null)
            comparison = 0
          else if (a.bestLap === null)
            comparison = 1
          else if (b.bestLap === null)
            comparison = -1
          else comparison = a.bestLap - b.bestLap
          break
        case 'driver':
          comparison = a.driverName.localeCompare(b.driverName)
          break
        case 'laps':
          comparison = b.lapCount - a.lapCount // Descending by default
          break
      }

      return sortAsc ? comparison : -comparison
    })

    return result
  }, [entries, effectiveSelectedClass, sortBy, sortAsc, showRegisteredOnly, isRegistered, enableClassGrouping, enableParticipantsFiltering])

  const toggleSortDirection = () => setSortAsc(!sortAsc)

  return {
    filtered,
    classes,
    selectedClass: effectiveSelectedClass,
    setSelectedClass,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    toggleSortDirection,
    showRegisteredOnly,
    setShowRegisteredOnly,
  }
}
