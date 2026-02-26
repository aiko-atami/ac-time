// React adapter and matching helpers for championship participants model.

import { useUnit } from 'effector-react'
import { useCallback, useEffect, useMemo } from 'react'
import type { ProcessedEntry } from '@/shared/types'
import type { UseChampionshipParticipantsOptions } from './participants.model'
import {
  $matchByDriverNameOnly,
  $participants,
  $participantsLoading,
  participantsOptionsChanged,
} from './participants.model'

export interface NormalizedParticipant {
  nameKey: string
  carClass: string
  hasDeclaredCar: boolean
  carTokens: string[]
}

/**
 * Normalizes text for case-insensitive map keys.
 * @param value Source text.
 * @returns Trimmed lower-cased string.
 */
function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Builds deterministic driver name key (order-independent words).
 * @param value Driver name.
 * @returns Canonical key for matching.
 */
export function toNameKey(value: string): string {
  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .sort()
    .join(' ')
}

/** Noise tokens filtered from car names (prefixes, short words, years). */
const CAR_TOKEN_STOPWORDS = new Set<string>([])

/**
 * Tokenizes car name into comparable word set.
 * Splits by whitespace/hyphens, lowercases, filters noise (years, ≤1-char, stopwords).
 * @param car Raw car name string.
 * @returns Normalized token array.
 */
export function toCarTokens(car: string): string[] {
  return normalizeText(car)
    .split(/[\s\-_]+/)
    .filter((t) => {
      if (t.length <= 1) return false
      if (/^\d{4}$/.test(t)) return false
      if (CAR_TOKEN_STOPWORDS.has(t)) return false
      return true
    })
}

/**
 * Checks whether participant declared a car in CSV.
 * Empty value and "-" mean "car is not specified".
 * @param value Raw CSV car value.
 * @returns True when car value is usable for car matching.
 */
export function hasDeclaredCar(value: string): boolean {
  const normalizedValue = value.trim()
  return normalizedValue !== '' && normalizedValue !== '-'
}

/**
 * Checks if two car token arrays share at least `minOverlap` common tokens.
 * @param a First token array.
 * @param b Second token array.
 * @param minOverlap Minimum shared tokens required.
 * @returns True when overlap threshold met.
 */
export function hasCarTokenOverlap(
  a: string[],
  b: string[],
  minOverlap = 2,
): boolean {
  if (a.length === 0 || b.length === 0) return false
  const setB = new Set(b)
  let count = 0
  for (const token of a) {
    if (setB.has(token)) {
      count++
      if (count >= minOverlap) return true
    }
  }
  return false
}

/**
 * Matches a single participant candidate against leaderboard entry by class and car rules.
 * When participant has no car in CSV, class match is enough.
 * @param candidate Normalized participant candidate with same driver name.
 * @param entryClass Normalized leaderboard class.
 * @param entryCarTokens Normalized leaderboard car tokens.
 * @returns True when candidate matches class/car constraints.
 */
export function matchesParticipantCandidate(
  candidate: NormalizedParticipant,
  entryClass: string,
  entryCarTokens: string[],
): boolean {
  if (candidate.carClass !== entryClass) return false

  if (!candidate.hasDeclaredCar) return true

  return hasCarTokenOverlap(candidate.carTokens, entryCarTokens)
}

/**
 * Loads championship participants and provides registration matching utility.
 * @param options Hook options.
 * @returns Participants state and `isRegistered` matcher.
 */
export function useChampionshipParticipants(
  options: UseChampionshipParticipantsOptions = {},
) {
  const { participantsCsvUrl, matchByDriverNameOnly = false } = options
  const {
    participants,
    loading,
    currentMatchByDriverNameOnly,
    setParticipantsOptions,
  } = useUnit({
    participants: $participants,
    loading: $participantsLoading,
    currentMatchByDriverNameOnly: $matchByDriverNameOnly,
    setParticipantsOptions: participantsOptionsChanged,
  })

  useEffect(() => {
    setParticipantsOptions({
      participantsCsvUrl,
      matchByDriverNameOnly,
    })
  }, [matchByDriverNameOnly, participantsCsvUrl, setParticipantsOptions])

  const normalizedParticipants = useMemo<NormalizedParticipant[]>(() => {
    return participants.map((participant) => {
      const nameKey = toNameKey(participant.driver)
      return {
        nameKey,
        carClass: normalizeText(participant.carClass),
        hasDeclaredCar: hasDeclaredCar(participant.car),
        carTokens: toCarTokens(participant.car),
      }
    })
  }, [participants])

  const participantsByName = useMemo(() => {
    const map = new Map<string, NormalizedParticipant[]>()
    for (const p of normalizedParticipants) {
      const list = map.get(p.nameKey)
      if (list) list.push(p)
      else map.set(p.nameKey, [p])
    }
    return map
  }, [normalizedParticipants])

  /**
   * Checks whether entry exists in registered participants list.
   * @param entry Leaderboard entry.
   * @returns True when entry has registration match.
   */
  const isRegistered = useCallback(
    (entry: ProcessedEntry): boolean => {
      if (normalizedParticipants.length === 0) return false

      const entryNameKey = toNameKey(entry.driverName)
      const candidates = participantsByName.get(entryNameKey)
      if (!candidates) return false
      if (currentMatchByDriverNameOnly) return true

      const entryClass = normalizeText(entry.carClass)
      const entryCarTokens = toCarTokens(entry.carName)

      return candidates.some((p) =>
        matchesParticipantCandidate(p, entryClass, entryCarTokens),
      )
    },
    [
      currentMatchByDriverNameOnly,
      normalizedParticipants.length,
      participantsByName,
    ],
  )

  return { participants, loading, isRegistered }
}
