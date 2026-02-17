// Tests for leaderboard data model contracts: params flow, effect calls, loading and error states.
import type { CarClassRule, ProcessedLeaderboard } from '@/shared/types'
import { allSettled, fork } from 'effector'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CLASS_RULES } from '@/shared/config/constants'
import {
  $leaderboardData,
  $leaderboardError,
  $leaderboardLoading,
  $leaderboardRequestParams,
  leaderboardParamsChanged,
  leaderboardRefetchRequested,
  loadLeaderboardFx,
} from './data.model'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}
interface LeaderboardFxParams {
  serverUrl?: string
  classRules: CarClassRule[]
}

/**
 * Builds deferred promise to observe pending state before async effect resolves.
 * @returns Deferred object with exposed resolve function.
 */
function createDeferred<T>(): Deferred<T> {
  let resolve: ((value: T) => void) | null = null
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return {
    promise,
    resolve: (value: T) => {
      if (!resolve)
        throw new Error('Deferred resolve is not initialized')
      resolve(value)
    },
  }
}

/**
 * Produces minimal valid leaderboard payload for tests.
 * @returns Processed leaderboard fixture.
 */
function createLeaderboardFixture(): ProcessedLeaderboard {
  return {
    leaderboard: [],
    serverName: 'Test server',
    track: 'Monza',
    sessionName: 'Practice',
    lastUpdate: '2026-02-17T00:00:00.000Z',
  }
}

describe('data.model', () => {
  it('should update request params and use default class rules when omitted', async () => {
    const scope = fork({
      handlers: [[loadLeaderboardFx, () => createLeaderboardFixture()]],
    })
    await allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/leaderboard.json' },
    })
    expect(scope.getState($leaderboardRequestParams)).toEqual({
      serverUrl: 'https://example.test/leaderboard.json',
      classRules: DEFAULT_CLASS_RULES,
    })
  })

  it('should call effect on params change and store response payload', async () => {
    const payload = createLeaderboardFixture()
    const calls: Array<{ serverUrl?: string, classRules: CarClassRule[] }> = []
    const classRules: CarClassRule[] = [{ name: 'GT3', patterns: ['gt3'] }]
    const scope = fork({
      handlers: [[loadLeaderboardFx, async (params: LeaderboardFxParams) => {
        calls.push(params)
        return payload
      }]],
    })
    await allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/live.json', classRules },
    })
    expect(calls).toEqual([{
      serverUrl: 'https://example.test/live.json',
      classRules,
    }])
    expect(scope.getState($leaderboardData)).toEqual(payload)
  })

  it('should refetch using latest saved request params', async () => {
    const firstRules: CarClassRule[] = [{ name: 'First', patterns: ['first'] }]
    const secondRules: CarClassRule[] = [{ name: 'Second', patterns: ['second'] }]
    const calls: Array<{ serverUrl?: string, classRules: CarClassRule[] }> = []
    const scope = fork({
      handlers: [[loadLeaderboardFx, async (params: LeaderboardFxParams) => {
        calls.push(params)
        return createLeaderboardFixture()
      }]],
    })
    await allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/first.json', classRules: firstRules },
    })
    await allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/second.json', classRules: secondRules },
    })
    await allSettled(leaderboardRefetchRequested, { scope })
    expect(calls.at(-1)).toEqual({
      serverUrl: 'https://example.test/second.json',
      classRules: secondRules,
    })
  })

  it('should set error on failure and clear it after success', async () => {
    let failOnce = true
    const scope = fork({
      handlers: [[loadLeaderboardFx, async () => {
        if (failOnce) {
          failOnce = false
          throw new Error('Network failed')
        }
        return createLeaderboardFixture()
      }]],
    })
    await allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/failable.json' },
    })
    expect(scope.getState($leaderboardError)?.message).toBe('Network failed')

    await allSettled(leaderboardRefetchRequested, { scope })
    expect(scope.getState($leaderboardError)).toBeNull()
  })

  it('should expose pending loading state while async request is in flight', async () => {
    const deferred = createDeferred<ProcessedLeaderboard>()
    const scope = fork({
      handlers: [[loadLeaderboardFx, () => deferred.promise]],
    })
    const running = allSettled(leaderboardParamsChanged, {
      scope,
      params: { serverUrl: 'https://example.test/slow.json' },
    })
    await Promise.resolve()
    expect(scope.getState($leaderboardLoading)).toBe(true)
    deferred.resolve(createLeaderboardFixture())
    await running
    expect(scope.getState($leaderboardLoading)).toBe(false)
  })
})
