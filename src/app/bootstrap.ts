// App bootstrap module that creates one Effector scope and initializes router history in that scope.
import type { Scope } from 'effector'
import { historyAdapter } from '@argon-router/core'
import { allSettled, fork } from 'effector'
import { createBrowserHistory } from 'history'
import { initializeApp } from '@/shared/init'
import { router } from './router'

export const appScope = fork()

let bootstrapPromise: Promise<void> | null = null

/**
 * Initializes app startup events and router history in a single Effector scope.
 * @param scope Effector scope used by the mounted React tree.
 * @returns Promise resolved when startup events and history wiring are complete.
 */
export function bootstrapApp(scope: Scope = appScope): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    await allSettled(initializeApp, { scope })
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createBrowserHistory()),
    })
  })()

  return bootstrapPromise
}
