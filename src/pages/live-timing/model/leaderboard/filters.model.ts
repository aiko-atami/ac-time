// Effector model for leaderboard filter state and declarative filter interactions.
import { createEvent, createStore, sample } from 'effector'

export type SortField = 'lapTime' | 'driver' | 'laps'

const DEFAULT_SELECTED_CLASS = 'All'
const DEFAULT_SORT_BY: SortField = 'lapTime'
const DEFAULT_SORT_ASC = true
const DEFAULT_SHOW_REGISTERED_ONLY = false
const DEFAULT_SEARCH_QUERY = ''

// User selected a specific car class filter value.
export const classSelected = createEvent<string>()
// User selected a field used for leaderboard sorting.
export const sortFieldSelected = createEvent<SortField>()
// Set sort direction explicitly (true = asc, false = desc).
export const sortDirectionSet = createEvent<boolean>()
// User clicked the sort direction control and expects direction inversion.
export const sortDirectionToggleClicked = createEvent()
// Toggle whether only registered participants should be visible.
export const registeredOnlySet = createEvent<boolean>()
// Notify model that class grouping capability changed in active settings.
export const classGroupingAvailabilityChanged = createEvent<boolean>()
// User changed text query for leaderboard search.
export const searchQueryChanged = createEvent<string>()

// Current car class filter selected by user.
export const $selectedClass = createStore<string>(DEFAULT_SELECTED_CLASS)
  .on(classSelected, (_, value) => value)

// Current active sort field for leaderboard entries.
export const $sortBy = createStore<SortField>(DEFAULT_SORT_BY)
  .on(sortFieldSelected, (_, value) => value)

// Current sort direction state shared by filter controls.
export const $sortAsc = createStore<boolean>(DEFAULT_SORT_ASC)
  .on(sortDirectionSet, (_, value) => value)

// Whether "registered only" filter is currently enabled.
export const $showRegisteredOnly = createStore<boolean>(DEFAULT_SHOW_REGISTERED_ONLY)
  .on(registeredOnlySet, (_, value) => value)

// Current text query used for client-side leaderboard search.
export const $searchQuery = createStore<string>(DEFAULT_SEARCH_QUERY)
  .on(searchQueryChanged, (_, value) => value)

// Declaratively invert sort direction on toggle click.
sample({
  clock: sortDirectionToggleClicked,
  source: $sortAsc,
  fn: sortAsc => !sortAsc,
  target: sortDirectionSet,
})

// Force class filter back to "All" when class grouping is disabled.
sample({
  clock: classGroupingAvailabilityChanged,
  filter: isEnabled => !isEnabled,
  fn: () => DEFAULT_SELECTED_CLASS,
  target: classSelected,
})
