// @anchor: leaderboard/features/championship-participants/model/use-championship-participants
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

interface NormalizedParticipant {
  nameKey: string
  strictKey: string
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
function toNameKey(value: string): string {
  return normalizeText(value)
    .split(/\s+/)
    .filter(word => word.length > 0)
    .sort()
    .join(' ')
}

/**
 * Builds strict key containing class, car and driver name signature.
 * @param carClass Car class label.
 * @param car Car model/name.
 * @param nameKey Canonical driver name key.
 * @returns Stable strict-match key.
 */
function toStrictKey(carClass: string, car: string, nameKey: string): string {
  return `${normalizeText(carClass)}|${normalizeText(car)}|${nameKey}`
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
        strictKey: toStrictKey(participant.carClass, participant.car, nameKey),
      }
    })
  }, [participants])

  const participantsByName = useMemo(() => {
    return new Set(normalizedParticipants.map(participant => participant.nameKey))
  }, [normalizedParticipants])

  const participantsByStrictMatch = useMemo(() => {
    return new Set(normalizedParticipants.map(participant => participant.strictKey))
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
    if (matchByDriverNameOnly) {
      return participantsByName.has(entryNameKey)
    }

    const strictKey = toStrictKey(entry.carClass, entry.carName, entryNameKey)
    return participantsByStrictMatch.has(strictKey)
  }, [matchByDriverNameOnly, normalizedParticipants.length, participantsByName, participantsByStrictMatch])

  return { participants, loading, isRegistered }
}
