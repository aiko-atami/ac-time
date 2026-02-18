// Shared validation functions for settings forms and preset management.
import {
  MAX_PACE_PERCENT_THRESHOLD,
  MIN_PACE_PERCENT_THRESHOLD,
} from '@/shared/config/constants'

/**
 * Validates required HTTP URL input.
 * @param value URL string from input.
 * @returns Validation error text or null when valid.
 */
export function validateRequiredHttpUrl(value: string): string | null {
  if (!value.trim()) {
    return 'URL is required.'
  }

  return validateOptionalHttpUrl(value)
}

/**
 * Validates optional HTTP URL input.
 * @param value URL string from input.
 * @returns Validation error text or null when valid/empty.
 */
export function validateOptionalHttpUrl(value: string): string | null {
  if (!value.trim()) {
    return null
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL must use http or https.'
    }
    return null
  }
  catch {
    return 'URL is invalid.'
  }
}

/**
 * Validates allowed pace threshold percentage.
 * @param value Raw input string.
 * @returns Validation error text or null.
 */
export function validatePacePercentThreshold(value: string): string | null {
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
