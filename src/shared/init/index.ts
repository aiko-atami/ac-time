// App-level bootstrap model to trigger business logic from explicit startup point.
import { createEvent } from 'effector'
import { once } from 'patronum/once'

// Fired when the app bootstrap is requested.
const appInitializationRequested = createEvent()
// Fired when the app bootstrap is completed for the first time.
const appStarted = once(appInitializationRequested)

export {
  appStarted,
  appInitializationRequested as initializeApp,
}
