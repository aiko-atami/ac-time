// Shared route units used by app router and page-level navigation links.
import { createRoute } from '@argon-router/core'

export const liveTimingRoute = createRoute({ path: '/' })
export const settingsRoute = createRoute({ path: '/settings' })

export const routes = {
  liveTiming: liveTimingRoute,
  settings: settingsRoute,
}
