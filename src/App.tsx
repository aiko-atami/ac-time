// @anchor: leaderboard/app/root
// @intent: App composition wiring settings presets, data loading and leaderboard UI.
import type { ProcessedEntry } from '@/lib/types'
import { ErrorState } from '@/components/ErrorState'
import { Leaderboard } from '@/components/Leaderboard'
import { LeaderboardFilters } from '@/components/LeaderboardFilters'
import { LoadingState } from '@/components/LoadingState'
import { SettingsDialog } from '@/components/SettingsDialog'
import { useSettingsPresets } from '@/features/settings/model/useSettingsPresets'
import { useChampionshipParticipants } from '@/hooks/useChampionshipParticipants'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useLeaderboardFilters } from '@/hooks/useLeaderboardFilters'
import { DEFAULT_REFRESH_INTERVAL } from '@/lib/constants'

const EMPTY_LEADERBOARD_ENTRIES: ProcessedEntry[] = []

/**
 * Root app component.
 * @returns Main app layout and content.
 */
export function App() {
  const {
    presets,
    activePresetId,
    activePreset,
    selectPreset,
    createNewPreset,
    renameCurrentPreset,
    deleteCurrentPreset,
    saveActivePresetSettings,
  } = useSettingsPresets()

  const activeSettings = activePreset?.settings ?? null
  const enableClassGrouping = (activeSettings?.carClasses.length ?? 0) > 0

  // Fetch championship participants (moved from children to avoid multiple calls)
  const { isRegistered } = useChampionshipParticipants({
    participantsCsvUrl: activeSettings?.participants.csvUrl,
  })

  // Fetch leaderboard data with 60s auto-refresh
  const { data, loading, error } = useLeaderboard({
    serverUrl: activeSettings?.serverUrl,
    refreshInterval: DEFAULT_REFRESH_INTERVAL,
    classRules: activeSettings?.carClasses,
  })

  // Filter and sort logic
  // Ensure we have a valid array even if data is null
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
  )

  /**
   * Renders app header block.
   * @returns Header JSX.
   */
  const renderHeader = () => (
    <header className="mb-4 sm:mb-5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 mb-1 min-w-0 flex-1">
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
          onRenameActivePreset={renameCurrentPreset}
          onDeleteActivePreset={deleteCurrentPreset}
          onSaveActivePreset={saveActivePresetSettings}
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

  /**
   * Renders main content state machine.
   * @returns Main content JSX by state.
   */
  const renderMainContent = () => {
    // Loading state
    if (loading && !data) {
      return <LoadingState />
    }

    // Error state
    if (error) {
      return <ErrorState message={error.message} />
    }

    // No data
    if (!data) {
      return <ErrorState message="No data available" />
    }

    return (
      <>
        {/* Error Message (Partial) */}
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

        {/* Filters */}
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

        {/* Leaderboard */}
        <Leaderboard entries={filtered} isRegistered={isRegistered} />
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

export default App
