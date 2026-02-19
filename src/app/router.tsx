// Router instance only — non-component export, kept separate from views for Fast Refresh.
import { createRouter } from '@argon-router/core'
import { routes } from '@/shared/routing'

export const router = createRouter({
  routes: [routes.liveTiming, routes.settings],
})
