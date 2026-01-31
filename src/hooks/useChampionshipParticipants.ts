import type { ProcessedEntry } from '@/lib/types'
import { useEffect, useState } from 'react'
import { CSV_URL } from '@/lib/constants'

interface Participant {
  driver: string
  carClass: string
  team?: string
  car: string
}

/**
 * EXPECTED CSV FORMAT
 * -------------------
 * Source: /api/participants -> GitHub Release CSV
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
async function fetchParticipantsList(): Promise<Participant[]> {
  const response = await fetch(CSV_URL)
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

export function useChampionshipParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParticipantsList()
      .then(setParticipants)
      .catch(err => console.error('Error loading participants:', err))
      .finally(() => setLoading(false))
  }, [])

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
  if (
    entry.carName.trim().toLowerCase() !== participant.car.trim().toLowerCase()
    // TODO: Temporary hack, remove later
    && participant.carClass.toLowerCase() !== 'бронза'
  ) {
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
