// Lightweight toast provider and viewport for transient success/error feedback.
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'

import { cn } from '@/shared/lib/utils'
import {
  ToastContext,
  type ToastContextValue,
  type ToastVariant,
} from '@/shared/ui/toast-context'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

const TOAST_LIFETIME_MS = 2800

interface ToastProviderProps {
  children: ReactNode
}

/**
 * Provides app-wide toast queue and viewport.
 * @param props Provider props.
 * @param props.children Nested app tree.
 * @returns Provider with rendered toast viewport.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([])

  /**
   * Removes toast item from queue by id.
   * @param id Toast id.
   */
  const dismissToast = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  /**
   * Pushes a new toast message and schedules auto-dismiss.
   * @param message Toast text.
   * @param variant Optional visual variant.
   */
  const pushToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setItems((current) => [...current, { id, message, variant }])
      window.setTimeout(() => dismissToast(id), TOAST_LIFETIME_MS)
    },
    [dismissToast],
  )

  const value = useMemo<ToastContextValue>(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[120] flex w-[min(90vw,24rem)] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 rounded-lg border px-3 py-2 text-sm shadow-sm backdrop-blur-xs',
              item.variant === 'success' &&
                'border-emerald-300 bg-emerald-50 text-emerald-900',
              item.variant === 'error' &&
                'border-destructive/40 bg-destructive/10 text-destructive',
              item.variant === 'info' &&
                'border-border bg-background text-foreground',
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
