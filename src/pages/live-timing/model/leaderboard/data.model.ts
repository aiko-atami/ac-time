// Effector model for loading and refreshing live timing leaderboard data.
import type { CarClassRule, ProcessedLeaderboard } from '@/shared/types'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { fetchLeaderboard } from '@/shared/api/leaderboard'
import { DEFAULT_CLASS_RULES } from '@/shared/config/constants'

export interface LeaderboardRequestParams {
  serverUrl?: string
  classRules?: CarClassRule[]
}

interface LeaderboardRequestState {
  serverUrl?: string
  classRules: CarClassRule[]
}

const DEFAULT_REQUEST_PARAMS: LeaderboardRequestState = {
  classRules: DEFAULT_CLASS_RULES,
}

// UI/settings changed request parameters for leaderboard loading.
export const leaderboardParamsChanged = createEvent<LeaderboardRequestParams>()
// Trigger a manual/periodic refresh using latest known request params.
export const leaderboardRefetchRequested = createEvent()

// Last known params used to load leaderboard data.
export const $leaderboardRequestParams = createStore<LeaderboardRequestState>(DEFAULT_REQUEST_PARAMS)
  .on(leaderboardParamsChanged, (_, params) => ({
    serverUrl: params.serverUrl,
    classRules: params.classRules ?? DEFAULT_CLASS_RULES,
  }))

// Performs API call to load processed leaderboard payload.
export const loadLeaderboardFx = createEffect(
  async (params: LeaderboardRequestState): Promise<ProcessedLeaderboard> =>
    fetchLeaderboard(params.serverUrl, params.classRules),
)

// Latest successfully loaded leaderboard response.
export const $leaderboardData = createStore<ProcessedLeaderboard | null>(null)
  .on(loadLeaderboardFx.doneData, (_, payload) => payload)

// Unhandled runtime error from effect boundary (network throws, etc).
export const $leaderboardError = createStore<Error | null>(null)
  .on(loadLeaderboardFx.failData, (_, error) => error)
  .reset(loadLeaderboardFx.done)

// True while leaderboard loading effect is in progress.
export const $leaderboardLoading = loadLeaderboardFx.pending

sample({
  clock: leaderboardParamsChanged,
  source: $leaderboardRequestParams,
  target: loadLeaderboardFx,
})

sample({
  clock: leaderboardRefetchRequested,
  source: $leaderboardRequestParams,
  target: loadLeaderboardFx,
})
