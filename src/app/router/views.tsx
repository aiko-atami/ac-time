// Route-to-page view mapping rendered by a single root routes view.
import { createRoutesView, createRouteView, Link } from '@argon-router/react'
import { LiveTimingPage } from '@/pages/live-timing'
import { SettingsPage } from '@/pages/settings'
import { routes } from '@/shared/routing'
import { buttonVariants } from '@/shared/ui/button-variants'

const LiveTimingView = createRouteView({
  route: routes.liveTiming,
  view: LiveTimingPage,
})

const SettingsView = createRouteView({
  route: routes.settings,
  view: SettingsPage,
})

export const RoutesView = createRoutesView({
  routes: [LiveTimingView, SettingsView],
  otherwise: RouteNotFound,
})

function RouteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Link to={routes.liveTiming} className={buttonVariants({ variant: 'outline' })}>
        Back to Live Timing
      </Link>
    </div>
  )
}
