// Effector model for loading championship participants from CSV source.
import { createEffect, createEvent, createStore, sample } from 'effector'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Participant {
  driver: string
  carClass: string
  team?: string
  car: string
}

interface UseChampionshipParticipantsOptions {
  participantsCsvUrl?: string
  matchByDriverNameOnly?: boolean
}

interface ParticipantsLoadRequest {
  requestId: number
  sourceUrl: string
}

interface ParticipantsLoadDone {
  requestId: number
  participants: Participant[]
}

// User intent: update participants source URL and matching mode.
const participantsOptionsChanged =
  createEvent<UseChampionshipParticipantsOptions>()
const participantsLoadRequested = createEvent<ParticipantsLoadRequest>()
const participantsLoadSucceeded = createEvent<ParticipantsLoadDone>()
const participantsLoadFailed = createEvent()
const participantsReset = createEvent()

const $participants = createStore<Participant[]>([])
  .on(participantsLoadSucceeded, (_, payload) => payload.participants)
  .reset(participantsReset)

const $participantsLoading = createStore(false)
  .on(participantsLoadRequested, () => true)
  .on(participantsLoadSucceeded, () => false)
  .on(participantsLoadFailed, () => false)
  .on(participantsReset, () => false)

const $participantsRequestId = createStore(0).on(
  participantsLoadRequested,
  (_, payload) => payload.requestId,
)

const $matchByDriverNameOnly = createStore(false).on(
  participantsOptionsChanged,
  (_, options) => options.matchByDriverNameOnly ?? false,
)

const loadParticipantsFx = createEffect(
  async ({
    sourceUrl,
    requestId,
  }: ParticipantsLoadRequest): Promise<ParticipantsLoadDone> => {
    const participants = await fetchParticipantsList(sourceUrl)
    return { requestId, participants }
  },
)

// Convert options updates with valid URL into incremented load request payloads.
sample({
  clock: participantsOptionsChanged,
  filter: (_, options) => (options.participantsCsvUrl?.trim() ?? '').length > 0,
  source: $participantsRequestId,
  fn: (requestId, options) => ({
    requestId: requestId + 1,
    sourceUrl: options.participantsCsvUrl!.trim(),
  }),
  target: participantsLoadRequested,
})

// Reset participants state when source URL is missing or explicitly cleared.
sample({
  clock: participantsOptionsChanged,
  filter: (options) => (options.participantsCsvUrl?.trim() ?? '').length === 0,
  target: participantsReset,
})

// Start network loading effect for each accepted load request.
sample({
  clock: participantsLoadRequested,
  target: loadParticipantsFx,
})

// Commit only latest successful response to avoid stale in-flight overwrite.
sample({
  clock: loadParticipantsFx.doneData,
  source: $participantsRequestId,
  filter: (activeRequestId, payload) => activeRequestId === payload.requestId,
  fn: (_, payload) => payload,
  target: participantsLoadSucceeded,
})

// Mark load failure only for active request and stop loading state.
sample({
  clock: loadParticipantsFx.fail,
  source: $participantsRequestId,
  filter: (activeRequestId, payload) =>
    activeRequestId === payload.params.requestId,
  fn: () => undefined,
  target: participantsLoadFailed,
})

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
async function fetchParticipantsList(
  sourceUrl: string,
): Promise<Participant[]> {
  const response = await fetch(buildParticipantsProxyUrl(sourceUrl))
  if (!response.ok) throw new Error('Failed to fetch participants')

  const text = await response.text()
  const lines = text.split('\n')

  // Skip header (index 0) and parse lines
  // We start from line 1 (skipping header)
  return lines
    .slice(1)
    .map((line): Participant | null => {
      // Note: simple split by comma might fail if fields contain commas,
      // but the current source seems to be simple CSV.
      const cols = line.split(',').map((c) => c.trim())
      // We need at least 7 columns (index 0 to 6)
      if (cols.length < 7) return null
      return {
        driver: cols[1], // Index 1: Driver Name
        team: !cols[4] || cols[4] === '-' ? undefined : cols[4], // Index 4: Team
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

export {
  $matchByDriverNameOnly,
  $participants,
  $participantsLoading,
  participantsOptionsChanged,
}

export type { Participant, UseChampionshipParticipantsOptions }
