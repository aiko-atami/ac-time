// @anchor: leaderboard/pages/live-timing/ui
// @intent: Live timing page composition wiring settings, data loading, filters and leaderboard rendering.
import type { ProcessedEntry, ProcessedLeaderboard } from '@/shared/types'
import { Link } from '@argon-router/react'
import { IconSettings } from '@tabler/icons-react'
import { routes } from '@/shared/routing'
import { buttonVariants } from '@/shared/ui/button-variants'
import { useLiveTimingPageModel } from '../model/useLiveTimingPageModel'
import { Leaderboard } from './leaderboard/Leaderboard'
import { LeaderboardFilters } from './leaderboard/LeaderboardFilters'
import { ErrorState } from './states/ErrorState'
import { LoadingState } from './states/LoadingState'

// --- Sub-components ---

interface LiveTimingHeaderProps {
  data: ProcessedLeaderboard | null
}

/**
 * Renders page header with server info, session metadata and settings trigger.
 */
function LiveTimingHeader({ data }: LiveTimingHeaderProps) {
  return (
    <header className="mb-4 sm:mb-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 mb-1 min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            {data?.serverName || 'AC Live Timing'}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data?.sessionName && (
              <span className="font-semibold">
                {data.sessionName}
              </span>
            )}
            {data?.track && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>
                  @
                  {data.track}
                </span>
              </>
            )}
          </div>
        </div>

        <Link
          to={routes.settings}
          title="Settings"
          aria-label="Settings"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <IconSettings className="h-5 w-5" />
        </Link>
      </div>

      {data?.lastUpdate && (
        <p className="text-xs text-muted-foreground">
          Updated:
          {' '}
          {new Date(data.lastUpdate).toLocaleTimeString()}
        </p>
      )}
    </header>
  )
}

interface LiveTimingContentProps {
  data: ProcessedLeaderboard | null
  loading: boolean
  error: Error | null
  filtered: ProcessedEntry[]
  classes: string[]
  selectedClass: string
  setSelectedClass: (value: string) => void
  sortBy: 'lapTime' | 'driver' | 'laps'
  setSortBy: (value: 'lapTime' | 'driver' | 'laps') => void
  sortAsc: boolean
  toggleSortDirection: () => void
  showRegisteredOnly: boolean
  setShowRegisteredOnly: (value: boolean) => void
  pacePercentThreshold: number
  isRegistered: (entry: ProcessedEntry) => boolean
}

/**
 * Renders main content area: loading/error states, filters and leaderboard.
 * @param props Content props.
 * @returns Main content block.
 */
function LiveTimingContent(props: LiveTimingContentProps) {
  const {
    data,
    loading,
    error,
    filtered,
    classes,
    selectedClass,
    setSelectedClass,
    sortBy,
    setSortBy,
    sortAsc,
    toggleSortDirection,
    showRegisteredOnly,
    setShowRegisteredOnly,
    pacePercentThreshold,
    isRegistered,
  } = props

  if (loading && !data) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error.message} />
  }

  if (!data) {
    return <ErrorState message="No data available" />
  }

  return (
    <>
      {data.error && (
        <div className="mb-4 p-3 rounded-lg border border-destructive bg-destructive/10">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong className="font-semibold">Connection Error:</strong>
              {' '}
              <span className="text-sm">{data.error}</span>
            </div>
          </div>
        </div>
      )}

      <LeaderboardFilters
        classes={classes}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortAsc={sortAsc}
        onSortDirectionToggle={toggleSortDirection}
        showRegisteredOnly={showRegisteredOnly}
        onToggleRegisteredOnly={setShowRegisteredOnly}
      />

      <Leaderboard
        entries={filtered}
        pacePercentThreshold={pacePercentThreshold}
        isRegistered={isRegistered}
      />
    </>
  )
}

// --- Page component ---

/**
 * Renders live timing page and coordinates widget/feature interactions.
 * @returns Live timing page layout.
 */
export function LiveTimingPage() {
  const {
    data,
    loading,
    error,
    filtered,
    classes,
    selectedClass,
    setSelectedClass,
    sortBy,
    setSortBy,
    sortAsc,
    toggleSortDirection,
    showRegisteredOnly,
    setShowRegisteredOnly,
    pacePercentThreshold,
    isRegistered,
  } = useLiveTimingPageModel()

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl md:max-w-6xl lg:max-w-7xl">
        <LiveTimingHeader
          data={data}
        />
        <LiveTimingContent
          data={data}
          loading={loading}
          error={error}
          filtered={filtered}
          classes={classes}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortAsc={sortAsc}
          toggleSortDirection={toggleSortDirection}
          showRegisteredOnly={showRegisteredOnly}
          setShowRegisteredOnly={setShowRegisteredOnly}
          pacePercentThreshold={pacePercentThreshold}
          isRegistered={isRegistered}
        />
      </div>
    </div>
  )
}
