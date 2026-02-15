// @anchor: leaderboard/pages/live-timing/ui/leaderboard-styles
// @intent: Local style token map for leaderboard card/row rendering.
/**
 * Shared style constants for consistent UI across components
 */

// Card padding variants
export const cardPadding = {
  card: 'p-2.5 sm:p-3',
  row: 'px-3 py-2.5',
} as const

// Typography sizes
export const fontSize = {
  position: 'text-base',
  driver: 'text-sm sm:text-base',
  driverRow: 'text-sm',
  secondary: 'text-xs',
  time: 'text-sm',
  delta: 'text-xs',
  label: 'text-xs',
} as const

export const timeMeta = {
  delta: 'font-mono tabular-nums text-muted-foreground',
} as const

// Sector badge styles
export const sectorBadge = {
  best: 'text-xs font-mono font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground',
  theoretical: 'text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
} as const
