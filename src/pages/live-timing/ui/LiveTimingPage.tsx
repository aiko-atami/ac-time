// @anchor: leaderboard/pages/live-timing/ui
// @intent: Live timing page composition wiring settings, data loading, filters and leaderboard rendering.
import type { ProcessedEntry, ProcessedLeaderboard, SettingsSnapshot } from '@/shared/types'
import { useMemo } from 'react'
import { DEFAULT_PACE_PERCENT_THRESHOLD, DEFAULT_REFRESH_INTERVAL } from '@/shared/config/constants'
import { useChampionshipParticipants } from '../model/championship-participants/useChampionshipParticipants'
import { useLeaderboardFilters } from '../model/leaderboard/useLeaderboardFilters'
import { useSettingsPresets } from '../model/settings/useSettingsPresets'
import { useLeaderboard } from '../model/useLeaderboard'
import { Leaderboard } from './leaderboard/Leaderboard'
import { LeaderboardFilters } from './leaderboard/LeaderboardFilters'
import { SettingsDialog } from './settings/SettingsDialog'
import { ErrorState } from './states/ErrorState'
import { LoadingState } from './states/LoadingState'

const EMPTY_LEADERBOARD_ENTRIES: ProcessedEntry[] = []

// --- Sub-components ---

interface LiveTimingHeaderProps {
  data: ProcessedLeaderboard | null
  presets: ReturnType<typeof useSettingsPresets>
  activeSettings: SettingsSnapshot | null
}

/**
 * Renders page header with server info, session metadata and settings trigger.
 */
function LiveTimingHeader({ data, presets, activeSettings }: LiveTimingHeaderProps) {
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

        <SettingsDialog
          presets={presets.presets}
          activePresetId={presets.activePresetId}
          activeSettings={activeSettings}
          onSelectPreset={presets.selectPreset}
          onCreatePreset={presets.createNewPreset}
          onRenamePreset={presets.renamePresetById}
          onDeletePreset={presets.deletePresetById}
          onSavePreset={presets.savePresetSettingsById}
        />
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
  const presets = useSettingsPresets()

  const activeSettings = presets.activePreset?.settings ?? null
  const enableClassGrouping = (activeSettings?.carClasses.length ?? 0) > 0
  const enableParticipantsFiltering = Boolean(activeSettings?.participants.csvUrl.trim())

  const { isRegistered } = useChampionshipParticipants({
    participantsCsvUrl: activeSettings?.participants.csvUrl,
    matchByDriverNameOnly: !enableClassGrouping,
  })

  const classRules = useMemo(
    () => activeSettings?.carClasses,
    [activeSettings?.carClasses],
  )

  const { data, loading, error } = useLeaderboard({
    serverUrl: activeSettings?.serverUrl,
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    classRules,
  })

  const {
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
  } = useLeaderboardFilters(
    data?.leaderboard ?? EMPTY_LEADERBOARD_ENTRIES,
    isRegistered,
    enableClassGrouping,
    enableParticipantsFiltering,
  )

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl md:max-w-6xl lg:max-w-7xl">
        <LiveTimingHeader
          data={data}
          presets={presets}
          activeSettings={activeSettings}
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
          pacePercentThreshold={activeSettings?.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD}
          isRegistered={isRegistered}
        />
      </div>
    </div>
  )
}
