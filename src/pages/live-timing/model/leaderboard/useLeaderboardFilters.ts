// Client-side class/registration filters and sorting for leaderboard entries.
import type { SortField } from './filters.model'
import type { ProcessedEntry } from '@/shared/types'
import { useUnit } from 'effector-react'
import { useEffect, useMemo } from 'react'
import {
  $searchQuery,
  $selectedClass,
  $showRegisteredOnly,
  $sortAsc,
  $sortBy,
  classGroupingAvailabilityChanged,
  classSelected,
  registeredOnlySet,
  searchQueryChanged,
  sortDirectionSet,
  sortDirectionToggleClicked,
  sortFieldSelected,
} from './filters.model'

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
  searchQuery: string
  setSearchQuery: (value: string) => void
}

/**
 * Compares two entries according to selected sort field and direction.
 * @param left Left entry.
 * @param right Right entry.
 * @param sortBy Active sort field.
 * @param sortAsc Active sort direction.
 * @returns Numeric compare result compatible with `Array.sort`.
 */
function compareEntries(
  left: ProcessedEntry,
  right: ProcessedEntry,
  sortBy: SortField,
  sortAsc: boolean,
): number {
  let comparison = 0

  switch (sortBy) {
    case 'lapTime':
      if (left.bestLap === null && right.bestLap === null)
        comparison = 0
      else if (left.bestLap === null)
        comparison = 1
      else if (right.bestLap === null)
        comparison = -1
      else comparison = left.bestLap - right.bestLap
      break
    case 'driver':
      comparison = left.driverName.localeCompare(right.driverName)
      break
    case 'laps':
      comparison = right.lapCount - left.lapCount
      break
  }

  return sortAsc ? comparison : -comparison
}

/**
 * Normalizes search query for consistent matching behavior.
 * @param value Raw search query entered by user.
 * @returns Lowercased and trimmed query string.
 */
function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Checks whether leaderboard entry matches active search query.
 * @param entry Leaderboard entry candidate.
 * @param query Normalized search query.
 * @returns `true` when query is empty or matches any searchable field.
 */
function matchesSearch(entry: ProcessedEntry, query: string): boolean {
  if (!query)
    return true

  return (
    entry.driverName.toLowerCase().includes(query)
    || entry.teamName.toLowerCase().includes(query)
    || entry.carName.toLowerCase().includes(query)
    || entry.carModel.toLowerCase().includes(query)
  )
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
  const {
    selectedClass,
    sortBy,
    sortAsc,
    showRegisteredOnly,
    searchQuery,
    setSelectedClass,
    setSortBy,
    setSortAsc,
    toggleSortDirection,
    setShowRegisteredOnly,
    setSearchQuery,
    setClassGroupingAvailability,
  } = useUnit({
    selectedClass: $selectedClass,
    sortBy: $sortBy,
    sortAsc: $sortAsc,
    showRegisteredOnly: $showRegisteredOnly,
    searchQuery: $searchQuery,
    setSelectedClass: classSelected,
    setSortBy: sortFieldSelected,
    setSortAsc: sortDirectionSet,
    toggleSortDirection: sortDirectionToggleClicked,
    setShowRegisteredOnly: registeredOnlySet,
    setSearchQuery: searchQueryChanged,
    setClassGroupingAvailability: classGroupingAvailabilityChanged,
  })

  useEffect(() => {
    setClassGroupingAvailability(enableClassGrouping)
  }, [enableClassGrouping, setClassGroupingAvailability])

  // Get unique car classes
  const classes = useMemo(() => {
    if (!enableClassGrouping) {
      return ['All']
    }

    const uniqueClasses = new Set(entries.map(e => e.carClass))
    return ['All', ...Array.from(uniqueClasses)]
  }, [entries, enableClassGrouping])

  const effectiveSelectedClass = enableClassGrouping ? selectedClass : 'All'
  const normalizedSearchQuery = normalizeSearchValue(searchQuery)

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

    // Filter by free-text query across driver/car/team fields.
    result = result.filter(entry => matchesSearch(entry, normalizedSearchQuery))

    // Sort
    result.sort((left, right) => compareEntries(left, right, sortBy, sortAsc))

    return result
  }, [entries, effectiveSelectedClass, sortBy, sortAsc, showRegisteredOnly, normalizedSearchQuery, isRegistered, enableClassGrouping, enableParticipantsFiltering])

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
    searchQuery,
    setSearchQuery,
  }
}
