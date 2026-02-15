// @anchor: leaderboard/shared/lib/transform
// @intent: Transform raw leaderboard API payload into normalized and sorted UI entries.
import type {
  CarClassRule,
  Driver,
  LeaderboardData,
  ProcessedEntry,
} from '@/shared/types'

/**
 * Resolves car class by configured car rules.
 *
 * @param carName Car display name from timing payload.
 * @param carModel Car model id from timing payload.
 * @param rules Ordered car class rules.
 * @returns Matched class name or "Other" fallback.
 */
function getCarClass(carName: string, carModel: string, rules: CarClassRule[] = []): string {
  const name = (carName || '').toUpperCase()
  const model = (carModel || '').toUpperCase()

  // Iterate through rules in order
  for (const rule of rules) {
    // Check if any pattern matches either name or model
    const match = rule.patterns.some((pattern) => {
      const p = pattern.toUpperCase()
      return name.includes(p) || model.includes(p)
    })

    if (match) {
      return rule.name
    }
  }

  return 'Other'
}

/**
 * Flattens raw driver records into leaderboard entries with computed lap fields.
 *
 * @param drivers Connected or disconnected drivers from source payload.
 * @param rules Ordered car class rules.
 * @returns Processed entries without final sorting.
 */
function processDriverArray(drivers: Driver[], rules: CarClassRule[]): ProcessedEntry[] {
  const results: ProcessedEntry[] = []

  drivers.forEach((driver) => {
    const driverName = driver.CarInfo?.DriverName ?? 'Unknown'
    const teamName = driver.CarInfo ? driver.CarInfo.TeamName : ''
    const driverGuid = driver.CarInfo ? driver.CarInfo.DriverGUID : ''

    if (driver.Cars) {
      Object.keys(driver.Cars).forEach((carModel) => {
        const carData = driver.Cars![carModel]
        const carName = carData.CarName || carModel

        const bestLapNs = carData.BestLap
        let bestLapMs: number | null = null

        // Check for valid lap time (not max int-ish)
        if (bestLapNs && bestLapNs < 2147483647000000) {
          bestLapMs = Math.round(bestLapNs / 1000000)
        }

        // Best Splits (theoretical best - best splits from different laps)
        const splits: (number | null)[] = []
        if (carData.BestSplits) {
          const splitKeys = Object.keys(carData.BestSplits).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
          splitKeys.forEach((key) => {
            const s = carData.BestSplits![key]
            if (s && s.SplitTime && s.SplitTime < 2147483647000000) {
              splits.push(Math.round(s.SplitTime / 1000000))
            }
            else {
              splits.push(null)
            }
          })
        }

        // Best Lap Splits (splits from the actual best lap)
        const bestLapSplits: (number | null)[] = []
        if (carData.BestLapSplits) {
          const splitKeys = Object.keys(carData.BestLapSplits).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
          splitKeys.forEach((key) => {
            const s = carData.BestLapSplits![key]
            if (s && s.SplitTime && s.SplitTime < 2147483647000000) {
              bestLapSplits.push(Math.round(s.SplitTime / 1000000))
            }
            else {
              bestLapSplits.push(null)
            }
          })
        }

        // Calculate theoretical best lap (sum of best splits)
        let theoreticalBestLap: number | null = null
        if (splits.length > 0 && splits.every(s => s !== null)) {
          theoreticalBestLap = splits.reduce((sum, s) => sum! + s!, 0)
        }

        results.push({
          id: `${driverGuid}_${carModel}`,
          driverName,
          carName,
          carModel,
          carClass: getCarClass(carName, carModel, rules),
          teamName,
          bestLap: bestLapMs,
          splits,
          bestLapSplits,
          theoreticalBestLap,
          lapCount: carData.NumLaps || 0,
        })
      })
    }
  })

  return results
}

/**
 * Builds final leaderboard entries list from source payload.
 *
 * @param data Raw leaderboard payload.
 * @param rules Ordered car class rules.
 * @returns Processed and best-lap-sorted entries.
 */
export function processLeaderboard(data: LeaderboardData, rules: CarClassRule[] = []): ProcessedEntry[] {
  const processedData: ProcessedEntry[] = []

  // Process ConnectedDrivers if they exist
  if (data.ConnectedDrivers && data.ConnectedDrivers.length > 0) {
    processedData.push(...processDriverArray(data.ConnectedDrivers, rules))
  }

  // Process DisconnectedDrivers if they exist
  if (data.DisconnectedDrivers && data.DisconnectedDrivers.length > 0) {
    processedData.push(...processDriverArray(data.DisconnectedDrivers, rules))
  }

  // Sort by best lap (ascending), nulls last
  processedData.sort((a, b) => {
    if (a.bestLap === null)
      return 1
    if (b.bestLap === null)
      return -1
    return a.bestLap! - b.bestLap!
  })

  return processedData
}
