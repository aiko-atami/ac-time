// App runtime bootstrap utilities that run startup graph in the target Effector scope.
import type { Scope } from 'effector'
import type { History } from 'history'
import { historyAdapter } from '@argon-router/core'
import { allSettled, fork } from 'effector'
import { createBrowserHistory, createMemoryHistory } from 'history'
import { startApp } from '../model/bootstrap'

export const appScope = fork()

let appHistory: History | null = null
const bootstrapPromises = new WeakMap<Scope, Promise<void>>()

/**
 * Initializes app startup events and router history in the provided Effector scope.
 * @param scope Effector scope used by the mounted React tree.
 * @returns Promise resolved when startup flow is completed for this scope.
 */
export function bootstrapApp(scope: Scope = appScope): Promise<void> {
  const existingPromise = bootstrapPromises.get(scope)
  if (existingPromise) {
    return existingPromise
  }

  const bootstrapPromise = allSettled(startApp, {
    params: { history: historyAdapter(getAppHistory()) },
    scope,
  }).then(() => undefined)

  bootstrapPromises.set(scope, bootstrapPromise)
  return bootstrapPromise
}

/**
 * Returns singleton history instance appropriate for current runtime.
 * @returns Browser history in DOM runtime or memory history on server.
 */
function getAppHistory(): History {
  if (appHistory) {
    return appHistory
  }

  appHistory = isBrowserRuntime()
    ? createBrowserHistory()
    : createMemoryHistory()

  return appHistory
}

/**
 * Detects whether code executes in browser environment with DOM access.
 * @returns True when both window and document are available.
 */
function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
