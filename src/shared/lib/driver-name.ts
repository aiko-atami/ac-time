// @anchor: leaderboard/shared/lib/driver-name
// @intent: Normalize raw driver names into a consistent title-cased display format.
/**
 * Normalizes driver full name into title case.
 *
 * @param rawName Driver name received from backend/source payload.
 * @returns Normalized display name.
 */
export function normalizeDriverName(rawName: string): string {
  const collapsedName = rawName.trim().replace(/\s+/g, ' ')

  if (!collapsedName) {
    return 'Unknown'
  }

  return collapsedName
    .toLocaleLowerCase()
    .split(' ')
    .map(word => word
      .split(/([-'’])/)
      .map((part) => {
        if (/^[\-'’]$/.test(part) || part.length === 0) {
          return part
        }

        const [firstChar, ...restChars] = Array.from(part)
        return `${firstChar.toLocaleUpperCase()}${restChars.join('')}`
      })
      .join(''))
    .join(' ')
}
