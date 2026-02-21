// App startup model that fans out one bootstrap clock into feature-level startup events.
import type { historyAdapter } from '@argon-router/core'
import { createEvent, sample } from 'effector'
import { router } from '@/app/router'
import { pickupPresetsPersistence, requestSyncOfficialPresets } from '@/features/settings-presets'
import { pickupThresholdPersistence } from '@/features/settings-threshold'

export interface AppStartedPayload {
  history: ReturnType<typeof historyAdapter>
}

// Single startup clock consumed by app runtime bootstrap.
const appStarted = createEvent<AppStartedPayload>()

sample({
  clock: appStarted,
  fn: () => undefined,
  target: [
    requestSyncOfficialPresets,
    pickupPresetsPersistence,
    pickupThresholdPersistence,
  ],
})

sample({
  clock: appStarted,
  fn: ({ history }) => history,
  target: router.setHistory,
})

export { appStarted as startApp }
