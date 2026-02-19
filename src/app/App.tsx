// Application shell that mounts argon-router provider and route views.
import { RouterProvider } from '@argon-router/react'
import { Provider } from 'effector-react'
import { ToastProvider } from '@/shared/ui/toast'
import { appScope } from './lib/bootstrap'
import { router } from './router'
import { RoutesView } from './router/views'

/**
 * Root app component.
 * @returns Root router provider with mapped page views.
 */
export function App() {
  return (
    <Provider value={appScope}>
      <ToastProvider>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </ToastProvider>
    </Provider>
  )
}
