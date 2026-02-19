// Tests for global threshold model interactions and validation fallback.
import { allSettled, fork } from 'effector'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PACE_PERCENT_THRESHOLD } from '@/shared/config/constants'
import {
  $paceThreshold,
  $paceThresholdError,
  $paceThresholdInput,
  thresholdBlurred,
  thresholdInputChanged,
} from './threshold.model'

describe('threshold.model', () => {
  it('commits valid value on blur', async () => {
    const scope = fork()

    await allSettled(thresholdInputChanged, { scope, params: '110' })
    await allSettled(thresholdBlurred, { scope })

    expect(scope.getState($paceThreshold)).toBe(110)
    expect(scope.getState($paceThresholdInput)).toBe('110')
    expect(scope.getState($paceThresholdError)).toBeNull()
  })

  it('resets to default when input is invalid on blur', async () => {
    const scope = fork()

    await allSettled(thresholdInputChanged, { scope, params: '9999' })
    expect(scope.getState($paceThresholdError)).not.toBeNull()

    await allSettled(thresholdBlurred, { scope })

    expect(scope.getState($paceThreshold)).toBe(DEFAULT_PACE_PERCENT_THRESHOLD)
    expect(scope.getState($paceThresholdInput)).toBe(String(DEFAULT_PACE_PERCENT_THRESHOLD))
    expect(scope.getState($paceThresholdError)).toBeNull()
  })

  it('resets to default when input is empty on blur', async () => {
    const scope = fork()

    await allSettled(thresholdInputChanged, { scope, params: '' })
    await allSettled(thresholdBlurred, { scope })

    expect(scope.getState($paceThreshold)).toBe(DEFAULT_PACE_PERCENT_THRESHOLD)
    expect(scope.getState($paceThresholdInput)).toBe(String(DEFAULT_PACE_PERCENT_THRESHOLD))
  })
})
