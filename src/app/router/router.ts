// App router setup with known route registrations.
import { createRouter } from '@argon-router/core'
import { routes } from '@/shared/routing'

export const router = createRouter({
  routes: [routes.liveTiming, routes.settings],
})
