// Application shell that mounts argon-router provider and route views.
import { RouterProvider } from '@argon-router/react'
import { ToastProvider } from '@/shared/ui/toast'
import { router, RoutesView } from './router'

/**
 * Root app component.
 * @returns Root router provider with mapped page views.
 */
export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router}>
        <RoutesView />
      </RouterProvider>
    </ToastProvider>
  )
}
