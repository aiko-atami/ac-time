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

interface LeaderboardLoadRequest {
  requestId: number
  request: LeaderboardRequestState
}

interface LeaderboardLoadDone {
  requestId: number
  data: ProcessedLeaderboard
}

const DEFAULT_REQUEST_PARAMS: LeaderboardRequestState = {
  classRules: DEFAULT_CLASS_RULES,
}

// UI/settings changed request parameters for leaderboard loading.
export const leaderboardParamsChanged = createEvent<LeaderboardRequestParams>()
// Trigger a manual/periodic refresh using latest known request params.
export const leaderboardRefetchRequested = createEvent()
const leaderboardLoadRequested = createEvent<LeaderboardLoadRequest>()
const leaderboardDataReceived = createEvent<ProcessedLeaderboard>()
const leaderboardLoadFailed = createEvent<Error>()

// Last known params used to load leaderboard data.
export const $leaderboardRequestParams = createStore<LeaderboardRequestState>(DEFAULT_REQUEST_PARAMS)
  .on(leaderboardParamsChanged, (_, params) => ({
    serverUrl: params.serverUrl,
    classRules: params.classRules ?? DEFAULT_CLASS_RULES,
  }))

const $leaderboardRequestId = createStore(0)
  .on(leaderboardLoadRequested, (_, payload) => payload.requestId)

// Performs API call to load processed leaderboard payload.
export const loadLeaderboardFx = createEffect(
  async ({ request, requestId }: LeaderboardLoadRequest): Promise<LeaderboardLoadDone> => {
    const data = await fetchLeaderboard({
      serverUrl: request.serverUrl,
      classRules: request.classRules,
    })
    return { requestId, data }
  },
)

// Latest successfully loaded leaderboard response.
export const $leaderboardData = createStore<ProcessedLeaderboard | null>(null)
  .on(leaderboardDataReceived, (_, payload) => payload)

// Unhandled runtime error from effect boundary (network throws, etc).
export const $leaderboardError = createStore<Error | null>(null)
  .on(leaderboardLoadFailed, (_, error) => error)
  .reset(leaderboardDataReceived)

// True while leaderboard loading effect is in progress.
export const $leaderboardLoading = loadLeaderboardFx.pending

sample({
  clock: [leaderboardParamsChanged, leaderboardRefetchRequested],
  source: {
    request: $leaderboardRequestParams,
    requestId: $leaderboardRequestId,
  },
  fn: ({ request, requestId }) => ({
    request,
    requestId: requestId + 1,
  }),
  target: leaderboardLoadRequested,
})

sample({
  clock: leaderboardLoadRequested,
  target: loadLeaderboardFx,
})

sample({
  clock: loadLeaderboardFx.doneData,
  source: $leaderboardRequestId,
  filter: (activeRequestId, payload) => activeRequestId === payload.requestId,
  fn: (_, payload) => payload.data,
  target: leaderboardDataReceived,
})

sample({
  clock: loadLeaderboardFx.fail,
  source: $leaderboardRequestId,
  filter: (activeRequestId, payload) => activeRequestId === payload.params.requestId,
  fn: (_, payload) => payload.error instanceof Error
    ? payload.error
    : new Error('Failed to load leaderboard'),
  target: leaderboardLoadFailed,
})
