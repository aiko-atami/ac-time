// @anchor: leaderboard/pages/live-timing/ui
// @intent: Live timing page composition wiring settings, data loading, filters and leaderboard rendering.
import type { ProcessedEntry } from '@/shared/types'
import { useChampionshipParticipants } from '@/features/championship-participants'
import { Leaderboard, LeaderboardFilters, useLeaderboardFilters } from '@/features/leaderboard'
import { useSettingsPresets } from '@/features/settings'
import { DEFAULT_PACE_PERCENT_THRESHOLD, DEFAULT_REFRESH_INTERVAL } from '@/shared/config/constants'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { SettingsDialog } from '@/widgets/settings-dialog'
import { useLeaderboard } from '../model/useLeaderboard'

const EMPTY_LEADERBOARD_ENTRIES: ProcessedEntry[] = []

/**
 * Renders live timing page and coordinates widget/feature interactions.
 * @returns Live timing page layout.
 */
export function LiveTimingPage() {
  const {
    presets,
    activePresetId,
    activePreset,
    selectPreset,
    createNewPreset,
    renamePresetById,
    deletePresetById,
    savePresetSettingsById,
  } = useSettingsPresets()

  const activeSettings = activePreset?.settings ?? null
  const enableClassGrouping = (activeSettings?.carClasses.length ?? 0) > 0
  const enableParticipantsFiltering = Boolean(activeSettings?.participants.csvUrl.trim())

  const { isRegistered } = useChampionshipParticipants({
    participantsCsvUrl: activeSettings?.participants.csvUrl,
    matchByDriverNameOnly: !enableClassGrouping,
  })

  const { data, loading, error } = useLeaderboard({
    serverUrl: activeSettings?.serverUrl,
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    classRules: activeSettings?.carClasses,
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

  const renderHeader = () => (
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
          presets={presets}
          activePresetId={activePresetId}
          activeSettings={activeSettings}
          onSelectPreset={selectPreset}
          onCreatePreset={createNewPreset}
          onRenamePreset={renamePresetById}
          onDeletePreset={deletePresetById}
          onSavePreset={savePresetSettingsById}
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

  const renderMainContent = () => {
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
          pacePercentThreshold={activeSettings?.pacePercentThreshold ?? DEFAULT_PACE_PERCENT_THRESHOLD}
          isRegistered={isRegistered}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl md:max-w-6xl lg:max-w-7xl">
        {renderHeader()}
        {renderMainContent()}
      </div>
    </div>
  )
}
