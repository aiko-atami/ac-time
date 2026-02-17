// React adapter over Effector leaderboard model for page-level data consumption.
import type { CarClassRule, ProcessedLeaderboard } from '@/shared/types'
import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { DEFAULT_CLASS_RULES } from '@/shared/config/constants'
import {
  $leaderboardData,
  $leaderboardError,
  $leaderboardLoading,
  leaderboardParamsChanged,
  leaderboardRefetchRequested,
} from './leaderboard/data.model'

interface UseLeaderboardOptions {
  refreshInterval?: number // Auto-refresh interval in milliseconds
  serverUrl?: string // Target AC server JSON URL
  classRules?: CarClassRule[] // dynamic car class definitions
}

interface UseLeaderboardReturn {
  data: ProcessedLeaderboard | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Custom hook for fetching leaderboard data
 * Supports auto-refresh and manual refetch
 */
export function useLeaderboard(
  options: UseLeaderboardOptions = {},
): UseLeaderboardReturn {
  const { refreshInterval, serverUrl, classRules = DEFAULT_CLASS_RULES } = options

  const {
    data,
    loading,
    error,
    setLeaderboardParams,
    refetchLeaderboard,
  } = useUnit({
    data: $leaderboardData,
    loading: $leaderboardLoading,
    error: $leaderboardError,
    setLeaderboardParams: leaderboardParamsChanged,
    refetchLeaderboard: leaderboardRefetchRequested,
  })

  // Sync request params and load data when server/class rules change.
  useEffect(() => {
    setLeaderboardParams({ serverUrl, classRules })
  }, [serverUrl, classRules, setLeaderboardParams])

  // Keep periodic refresh behavior for active page session.
  useEffect(() => {
    if (!refreshInterval)
      return

    const interval = setInterval(() => {
      refetchLeaderboard()
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, refetchLeaderboard])

  /**
   * Reloads leaderboard using last known request params.
   */
  const refetch = (): void => {
    refetchLeaderboard()
  }

  return { data, loading, error, refetch }
}
