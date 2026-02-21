import { use } from 'react'

import { ToastContext } from '@/shared/ui/toast-context'

/**
 * Returns toast dispatch methods for current subtree.
 * @returns Hook API to show success/error/info toasts.
 */
export function useToast() {
  const context = use(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return {
    success: (message: string) => context.pushToast(message, 'success'),
    error: (message: string) => context.pushToast(message, 'error'),
    info: (message: string) => context.pushToast(message, 'info'),
  }
}
