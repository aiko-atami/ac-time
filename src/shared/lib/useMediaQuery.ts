// @anchor: leaderboard/shared/hooks/use-media-query
// @intent: Tracks CSS media query match state for responsive rendering decisions.
import { useCallback, useSyncExternalStore } from 'react'

/**
 * Returns whether current viewport matches media query.
 * @param query CSS media query string.
 * @returns True when query currently matches.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return () => {}

    const mediaQueryList = window.matchMedia(query)
    const handleChange = () => onStoreChange()

    mediaQueryList.addEventListener('change', handleChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [query])

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return false
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
