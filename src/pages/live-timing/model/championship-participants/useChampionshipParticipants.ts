// @anchor: leaderboard/pages/live-timing/model/championship-participants
// @intent: Load participants list from configurable CSV URL and match leaderboard entries.
import type { ProcessedEntry } from '@/shared/types'
import { useCallback, useEffect, useMemo, useReducer } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Participant {
  driver: string
  carClass: string
  team?: string
  car: string
}

export interface NormalizedParticipant {
  nameKey: string
  carClass: string
  hasDeclaredCar: boolean
  carTokens: string[]
}

/**
 * EXPECTED CSV FORMAT
 * -------------------
 * Source: participants CSV URL directly (usually GitHub Release CSV)
 *
 * Columns (0-indexed):
 * 0: Position (e.g. "1")
 * 1: Driver   (e.g. "Abubekirov Asker")
 * 2: Country  (e.g. "Россия")
 * 3: City     (e.g. "Нальчик")
 * 4: Team     (e.g. "Elbrus Motorsport", can be empty or "-")
 * 5: Class    (e.g. "Серебро")
 * 6: Car      (e.g. "LADA Vesta NG Super-production")
 */
async function fetchParticipantsList(sourceUrl: string): Promise<Participant[]> {
  const response = await fetch(buildParticipantsProxyUrl(sourceUrl))
  if (!response.ok)
    throw new Error('Failed to fetch participants')

  const text = await response.text()
  const lines = text.split('\n')

  // Skip header (index 0) and parse lines
  // We start from line 1 (skipping header)
  return lines.slice(1)
    .map((line): Participant | null => {
      // Note: simple split by comma might fail if fields contain commas,
      // but the current source seems to be simple CSV.
      const cols = line.split(',').map(c => c.trim())
      // We need at least 7 columns (index 0 to 6)
      if (cols.length < 7)
        return null
      return {
        driver: cols[1], // Index 1: Driver Name
        team: (!cols[4] || cols[4] === '-') ? undefined : cols[4], // Index 4: Team
        carClass: cols[5], // Index 5: Class
        car: cols[6], // Index 6: Car
      }
    })
    .filter((p): p is Participant => p !== null && !!p.driver)
}

/**
 * Builds API URL for participants proxy endpoint.
 * @param sourceUrl Direct CSV source URL from settings preset.
 * @returns Relative API endpoint with encoded query parameter.
 */
function buildParticipantsProxyUrl(sourceUrl: string): string {
  const search = new URLSearchParams({ csvUrl: sourceUrl })
  return `${API_URL}/api/participants?${search.toString()}`
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
    .filter(word => word.length > 0)
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
      if (t.length <= 1)
        return false
      if (/^\d{4}$/.test(t))
        return false
      if (CAR_TOKEN_STOPWORDS.has(t))
        return false
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
export function hasCarTokenOverlap(a: string[], b: string[], minOverlap = 2): boolean {
  if (a.length === 0 || b.length === 0)
    return false
  const setB = new Set(b)
  let count = 0
  for (const token of a) {
    if (setB.has(token)) {
      count++
      if (count >= minOverlap)
        return true
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
  if (candidate.carClass !== entryClass)
    return false

  if (!candidate.hasDeclaredCar)
    return true

  return hasCarTokenOverlap(candidate.carTokens, entryCarTokens)
}

interface UseChampionshipParticipantsOptions {
  participantsCsvUrl?: string
  matchByDriverNameOnly?: boolean
}

interface ParticipantsState {
  participants: Participant[]
  loading: boolean
}

type ParticipantsAction
  = | { type: 'load-start' }
    | { type: 'load-success', participants: Participant[] }
    | { type: 'load-failure' }

/**
 * Updates participants loading state machine.
 * @param state Current participants state.
 * @param action Action payload.
 * @returns Next participants state.
 */
function participantsReducer(state: ParticipantsState, action: ParticipantsAction): ParticipantsState {
  switch (action.type) {
    case 'load-start':
      return {
        ...state,
        loading: true,
      }
    case 'load-success':
      return {
        participants: action.participants,
        loading: false,
      }
    case 'load-failure':
      return {
        participants: [],
        loading: false,
      }
  }
}

/**
 * Loads championship participants and provides registration matching utility.
 * @param options Hook options.
 * @returns Participants state and `isRegistered` matcher.
 */
export function useChampionshipParticipants(options: UseChampionshipParticipantsOptions = {}) {
  const { participantsCsvUrl, matchByDriverNameOnly = false } = options
  const normalizedParticipantsCsvUrl = participantsCsvUrl?.trim() ?? ''
  const [{ participants, loading }, dispatch] = useReducer(participantsReducer, {
    participants: [],
    loading: true,
  })

  useEffect(() => {
    if (!normalizedParticipantsCsvUrl) {
      dispatch({ type: 'load-success', participants: [] })
      return
    }

    let cancelled = false
    dispatch({ type: 'load-start' })

    fetchParticipantsList(normalizedParticipantsCsvUrl)
      .then((result) => {
        if (!cancelled) {
          dispatch({ type: 'load-success', participants: result })
        }
      })
      .catch((err) => {
        console.error('Error loading participants:', err)
        if (!cancelled) {
          dispatch({ type: 'load-failure' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [normalizedParticipantsCsvUrl])

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
      if (list)
        list.push(p)
      else
        map.set(p.nameKey, [p])
    }
    return map
  }, [normalizedParticipants])

  /**
   * Checks whether entry exists in registered participants list.
   * @param entry Leaderboard entry.
   * @returns True when entry has registration match.
   */
  const isRegistered = useCallback((entry: ProcessedEntry): boolean => {
    if (normalizedParticipants.length === 0)
      return false

    const entryNameKey = toNameKey(entry.driverName)
    const candidates = participantsByName.get(entryNameKey)
    if (!candidates)
      return false
    if (matchByDriverNameOnly)
      return true

    const entryClass = normalizeText(entry.carClass)
    const entryCarTokens = toCarTokens(entry.carName)

    return candidates.some(
      p => matchesParticipantCandidate(p, entryClass, entryCarTokens),
    )
  }, [matchByDriverNameOnly, normalizedParticipants.length, participantsByName])

  return { participants, loading, isRegistered }
}
