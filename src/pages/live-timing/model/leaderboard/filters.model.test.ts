// Tests for leaderboard filter model contracts and declarative sample-based behavior.
import { allSettled, fork } from 'effector'
import { describe, expect, it } from 'vitest'
import {
  $selectedClass,
  $showRegisteredOnly,
  $sortAsc,
  $sortBy,
  classGroupingAvailabilityChanged,
  classSelected,
  registeredOnlySet,
  sortDirectionSet,
  sortDirectionToggleClicked,
  sortFieldSelected,
} from './filters.model'

describe('filters.model', () => {
  it('should update class filter when class is selected', async () => {
    const scope = fork()
    await allSettled(classSelected, { scope, params: 'GT3' })
    expect(scope.getState($selectedClass)).toBe('GT3')
  })

  it('should update sort field when selected', async () => {
    const scope = fork()
    await allSettled(sortFieldSelected, { scope, params: 'driver' })
    expect(scope.getState($sortBy)).toBe('driver')
  })

  it('should update sort direction when set explicitly', async () => {
    const scope = fork()
    await allSettled(sortDirectionSet, { scope, params: false })
    expect(scope.getState($sortAsc)).toBe(false)
  })

  it('should toggle sort direction on toggle click', async () => {
    const scope = fork()
    await allSettled(sortDirectionToggleClicked, { scope })
    expect(scope.getState($sortAsc)).toBe(false)
    await allSettled(sortDirectionToggleClicked, { scope })
    expect(scope.getState($sortAsc)).toBe(true)
  })

  it('should update registered-only flag', async () => {
    const scope = fork()
    await allSettled(registeredOnlySet, { scope, params: true })
    expect(scope.getState($showRegisteredOnly)).toBe(true)
  })

  it('should reset selected class to All when class grouping is disabled', async () => {
    const scope = fork()
    await allSettled(classSelected, { scope, params: 'GT4' })
    await allSettled(classGroupingAvailabilityChanged, { scope, params: false })
    expect(scope.getState($selectedClass)).toBe('All')
  })

  it('should keep selected class unchanged when class grouping remains enabled', async () => {
    const scope = fork()
    await allSettled(classSelected, { scope, params: 'GT4' })
    await allSettled(classGroupingAvailabilityChanged, { scope, params: true })
    expect(scope.getState($selectedClass)).toBe('GT4')
  })
})
