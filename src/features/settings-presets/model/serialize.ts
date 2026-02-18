// @anchor: leaderboard/pages/live-timing/model/settings-serialize
// @intent: Parse and format settings-specific text representations.
import type { CarClassRule } from '@/shared/types'

/**
 * Formats car class rules into a multiline textarea string.
 * @param rules Car class mapping rules.
 * @returns One rule per line in `Class: pattern1, pattern2` format.
 */
export function formatCarClasses(rules: CarClassRule[]): string {
  return rules
    .map(rule => `${rule.name}: ${rule.patterns.join(', ')}`)
    .join('\n')
}

/**
 * Parses car class rules from multiline textarea input.
 * @param csv Multiline class definition input.
 * @returns Normalized car class rules.
 */
export function parseCarClasses(csv: string): CarClassRule[] {
  const lines = csv
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const parsed = lines.map((line): CarClassRule => {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      return {
        name: line,
        patterns: [line],
      }
    }

    const name = line.slice(0, colonIndex).trim()
    const patterns = line
      .slice(colonIndex + 1)
      .split(',')
      .map(pattern => pattern.trim())
      .filter(Boolean)

    return {
      name,
      patterns: patterns.length > 0 ? patterns : [name],
    }
  })

  return dedupeCarClassRules(parsed)
}

/**
 * Removes duplicates and invalid records from class rules.
 * @param rules Source rules.
 * @returns Sanitized unique rules.
 */
export function dedupeCarClassRules(rules: CarClassRule[]): CarClassRule[] {
  const classNameSet = new Set<string>()
  const output: CarClassRule[] = []

  for (const rule of rules) {
    const normalizedName = rule.name.trim()
    if (!normalizedName) {
      continue
    }

    const classNameKey = normalizedName.toLowerCase()
    if (classNameSet.has(classNameKey)) {
      continue
    }

    const patternSet = new Set<string>()
    const patterns = rule.patterns
      .map(pattern => pattern.trim())
      .filter(Boolean)
      .filter((pattern) => {
        const key = pattern.toLowerCase()
        if (patternSet.has(key)) {
          return false
        }
        patternSet.add(key)
        return true
      })

    output.push({
      name: normalizedName,
      patterns: patterns.length > 0 ? patterns : [normalizedName],
    })

    classNameSet.add(classNameKey)
  }

  return output
}
