// @anchor: leaderboard/hooks/use-championship-participants
// @intent: Load participants list from configurable CSV URL and match leaderboard entries.
import type { ProcessedEntry } from '@/lib/types'
import { useEffect, useReducer } from 'react'
import { DEFAULT_PARTICIPANTS_CSV_URL } from '@/lib/constants'

interface Participant {
  driver: string
  carClass: string
  team?: string
  car: string
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
async function fetchParticipantsList(participantsCsvUrl?: string): Promise<Participant[]> {
  const sourceUrl = participantsCsvUrl?.trim() || DEFAULT_PARTICIPANTS_CSV_URL
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
  return `/api/participants?${search.toString()}`
}

interface UseChampionshipParticipantsOptions {
  participantsCsvUrl?: string
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
  const { participantsCsvUrl } = options
  const [{ participants, loading }, dispatch] = useReducer(participantsReducer, {
    participants: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'load-start' })

    fetchParticipantsList(participantsCsvUrl)
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
  }, [participantsCsvUrl])

  /**
   * Checks whether entry exists in registered participants list.
   * @param entry Leaderboard entry.
   * @returns True when entry has registration match.
   */
  const isRegistered = (entry: ProcessedEntry): boolean => {
    if (!participants.length)
      return false
    return participants.some(p => checkParticipantMatch(entry, p))
  }

  return { participants, loading, isRegistered }
}

/**
 * Checks if a live server entry matches a registered participant.
 *
 * Logic matches:
 * 1. Car Class (exact, case-insensitive)
 * 2. Car Name (exact, case-insensitive)
 * 3. Driver Name (word-set equality, case-insensitive, order-independent)
 */
function checkParticipantMatch(entry: ProcessedEntry, participant: Participant): boolean {
  // 1. Check Car Class Match
  if (entry.carClass.toLowerCase() !== participant.carClass.toLowerCase()) {
    return false
  }

  // 2. Check Car Name Match
  // Must match the car name exactly (case-insensitive)
  if (entry.carName.trim().toLowerCase() !== participant.car.trim().toLowerCase()) {
    return false
  }

  // 3. Check Driver Name Match (Order Independent)
  const entryNameParts = entry.driverName.toLowerCase().split(/\s+/).filter(p => p.length > 0)
  const pNameParts = participant.driver.toLowerCase().split(/\s+/).filter(p => p.length > 0)

  // If word counts differ, names don't match
  if (entryNameParts.length !== pNameParts.length)
    return false

  // Check if every word in entry name exists in participant name
  const pNameSet = new Set(pNameParts)
  return entryNameParts.every(part => pNameSet.has(part))
}
