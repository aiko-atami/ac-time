// Effector model for global pace threshold setting with localStorage persistence.
import { createEvent, createStore, sample } from 'effector'
import { persist } from 'effector-storage/local'
import {
  DEFAULT_PACE_PERCENT_THRESHOLD,
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
  SETTINGS_THRESHOLD_STORAGE_KEY,
} from '@/shared/config/constants'

// Internal event: storage payload restored and delivered to threshold stores.
const thresholdHydrated = createEvent<unknown>()
// User intent: update threshold input field text on every keystroke.
const thresholdInputChanged = createEvent<string>()
// User intent: finalize input editing (blur) and commit normalized numeric value.
const thresholdBlurred = createEvent<void>()
// Internal event: validated numeric threshold value accepted into canonical state.
const thresholdCommitted = createEvent<number>()
// Bootstrap intent: restore threshold value from localStorage in active app scope.
const thresholdPersistencePickupRequested = createEvent<void>()

// Canonical numeric threshold used by business logic.
const $paceThreshold = createStore<number>(DEFAULT_PACE_PERCENT_THRESHOLD)
  .on(thresholdHydrated, (_, payload) => normalizeThresholdValue(payload))
  .on(thresholdCommitted, (_, value) => value)

// UI-facing raw input value to support controlled field and intermediate invalid text.
const $paceThresholdInput = createStore<string>(String(DEFAULT_PACE_PERCENT_THRESHOLD))
  .on(thresholdHydrated, (_, payload) => String(normalizeThresholdValue(payload)))
  .on(thresholdInputChanged, (_, value) => value)
  .on(thresholdCommitted, (_, value) => String(value))

// Derived validation state for input error rendering.
const $paceThresholdError = $paceThresholdInput.map(value => validatePacePercentThreshold(value))

// Commit pipeline: on blur, validate/normalize text input and emit accepted numeric threshold.
sample({
  clock: thresholdBlurred,
  source: $paceThresholdInput,
  fn: (value) => {
    const validationError = validatePacePercentThreshold(value)
    if (validationError) {
      return DEFAULT_PACE_PERCENT_THRESHOLD
    }
    return Number.parseInt(value.trim(), 10)
  },
  target: thresholdCommitted,
})

if (isLocalStorageAvailable()) {
  // Persist canonical numeric threshold and hydrate stores from saved value on init.
  persist({
    source: $paceThreshold,
    target: thresholdHydrated,
    key: SETTINGS_THRESHOLD_STORAGE_KEY,
    pickup: thresholdPersistencePickupRequested,
  })
}

/**
 * Normalizes unknown threshold value into allowed integer range.
 * @param value Untrusted threshold payload.
 * @returns Valid threshold value.
 */
function normalizeThresholdValue(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PACE_PERCENT_THRESHOLD
  }

  const rounded = Math.round(value)
  if (rounded < MIN_PACE_PERCENT_THRESHOLD || rounded > MAX_PACE_PERCENT_THRESHOLD) {
    return DEFAULT_PACE_PERCENT_THRESHOLD
  }

  return rounded
}

/**
 * Validates pace threshold textual input.
 * @param value Raw input value.
 * @returns Validation error or null.
 */
function validatePacePercentThreshold(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Threshold is required.'
  }

  const numeric = Number(trimmed)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    return 'Threshold must be an integer.'
  }

  if (numeric < MIN_PACE_PERCENT_THRESHOLD || numeric > MAX_PACE_PERCENT_THRESHOLD) {
    return `Threshold must be between ${MIN_PACE_PERCENT_THRESHOLD} and ${MAX_PACE_PERCENT_THRESHOLD}.`
  }

  return null
}

/**
 * Checks whether runtime localStorage API is safely usable.
 * @returns True when storage get/set methods are available.
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined'
      && typeof localStorage.getItem === 'function'
      && typeof localStorage.setItem === 'function'
  }
  catch {
    return false
  }
}

export {
  $paceThreshold,
  $paceThresholdError,
  $paceThresholdInput,
  thresholdBlurred,
  thresholdInputChanged,
  thresholdPersistencePickupRequested,
}
