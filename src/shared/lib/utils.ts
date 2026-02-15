// @anchor: leaderboard/shared/lib/utils
// @intent: Shared formatting and class utilities for leaderboard UI and models.
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format lap time from milliseconds to MM:SS.mmm
 */
export function formatTime(ms: number | null): string {
  if (!ms || ms <= 0)
    return '-'

  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

/**
 * Format gap-to-leader delta from milliseconds to +S.mmm.
 */
export function formatDeltaTime(ms: number | null): string {
  if (ms === null || ms < 0)
    return '-'

  return `+${(ms / 1000).toFixed(3)}`
}
