// Tests for car class rule serialization and parsing (serialize.ts).
import { describe, expect, it } from 'vitest'
import { dedupeCarClassRules, formatCarClasses, parseCarClasses } from './serialize'

describe('formatCarClasses', () => {
  it('should format rules to multiline string', () => {
    const result = formatCarClasses([
      { name: 'GT3', patterns: ['bmw_z4_gt3', 'mercedes_sls'] },
      { name: 'GT4', patterns: ['ginetta_g55'] },
    ])
    expect(result).toBe('GT3: bmw_z4_gt3, mercedes_sls\nGT4: ginetta_g55')
  })

  it('should return empty string for empty array', () => {
    expect(formatCarClasses([])).toBe('')
  })
})

describe('parseCarClasses', () => {
  it('should parse lines with colon format', () => {
    const result = parseCarClasses('GT3: bmw_z4, audi_r8\nGT4: ginetta')
    expect(result).toEqual([
      { name: 'GT3', patterns: ['bmw_z4', 'audi_r8'] },
      { name: 'GT4', patterns: ['ginetta'] },
    ])
  })

  it('should fallback to line as both name and pattern when no colon', () => {
    const result = parseCarClasses('GT3\nGT4')
    expect(result).toEqual([
      { name: 'GT3', patterns: ['GT3'] },
      { name: 'GT4', patterns: ['GT4'] },
    ])
  })

  it('should skip blank lines', () => {
    const result = parseCarClasses('\n  \nGT3: foo\n\n')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('GT3')
  })

  it('should deduplicate class names case-insensitively', () => {
    const result = parseCarClasses('GT3: a\ngt3: b')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('GT3')
  })

  it('should use class name as pattern when no patterns after colon', () => {
    const result = parseCarClasses('GT3:')
    expect(result).toEqual([{ name: 'GT3', patterns: ['GT3'] }])
  })
})

describe('dedupeCarClassRules', () => {
  it('should remove duplicate class names (case-insensitive)', () => {
    const result = dedupeCarClassRules([
      { name: 'GT3', patterns: ['a'] },
      { name: 'gt3', patterns: ['b'] },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ name: 'GT3', patterns: ['a'] })
  })

  it('should remove duplicate patterns within a rule', () => {
    const result = dedupeCarClassRules([
      { name: 'GT3', patterns: ['bmw', 'BMW', 'audi'] },
    ])
    expect(result[0].patterns).toEqual(['bmw', 'audi'])
  })

  it('should skip rules with empty name after trimming', () => {
    const result = dedupeCarClassRules([
      { name: '  ', patterns: ['a'] },
      { name: 'GT3', patterns: ['b'] },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('GT3')
  })

  it('should use class name as fallback when all patterns are empty', () => {
    const result = dedupeCarClassRules([
      { name: 'GT3', patterns: ['', '  '] },
    ])
    expect(result[0].patterns).toEqual(['GT3'])
  })
})
