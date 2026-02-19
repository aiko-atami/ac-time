// React facade for global threshold settings model.
import { useUnit } from 'effector-react'
import {
  $paceThreshold,
  $paceThresholdError,
  $paceThresholdInput,
  thresholdBlurred,
  thresholdInputChanged,
} from './threshold.model'

interface UseSettingsThresholdReturn {
  pacePercentThreshold: number
  pacePercentThresholdInput: string
  pacePercentThresholdError: string | null
  setPacePercentThresholdInput: (value: string) => void
  commitPacePercentThreshold: () => void
}

/**
 * Exposes global pace threshold state and edit handlers.
 * @returns Threshold value, input value, and mutation events.
 */
export function useSettingsThreshold(): UseSettingsThresholdReturn {
  return useUnit({
    pacePercentThreshold: $paceThreshold,
    pacePercentThresholdInput: $paceThresholdInput,
    pacePercentThresholdError: $paceThresholdError,
    setPacePercentThresholdInput: thresholdInputChanged,
    commitPacePercentThreshold: thresholdBlurred,
  })
}
