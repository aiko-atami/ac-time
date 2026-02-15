// @anchor: leaderboard/pages/live-timing/ui/leaderboard-filters
// @intent: Stateless filter controls for class, sorting and registration visibility.
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface LeaderboardFiltersProps {
  classes: string[]
  selectedClass: string
  onClassChange: (value: string) => void
  sortBy: 'lapTime' | 'driver' | 'laps'
  onSortChange: (value: 'lapTime' | 'driver' | 'laps') => void
  sortAsc: boolean
  onSortDirectionToggle: () => void
  showRegisteredOnly: boolean
  onToggleRegisteredOnly: (value: boolean) => void
}

const SORT_OPTIONS = [
  { value: 'lapTime', label: 'Best Lap' },
  { value: 'driver', label: 'Driver Name' },
  { value: 'laps', label: 'Lap Count' },
] as const

/**
 * Renders leaderboard filter controls.
 * @param props Component props object.
 * @param props.classes Available class options.
 * @param props.selectedClass Selected class filter value.
 * @param props.onClassChange Callback to update selected class.
 * @param props.sortBy Selected sort field.
 * @param props.onSortChange Callback to update sort field.
 * @param props.sortAsc Whether sort direction is ascending.
 * @param props.onSortDirectionToggle Callback to toggle sort direction.
 * @param props.showRegisteredOnly Whether only registered drivers are shown.
 * @param props.onToggleRegisteredOnly Callback to toggle registration-only filter.
 * @returns Filter toolbar JSX.
 */
export function LeaderboardFilters(props: LeaderboardFiltersProps) {
  const {
    classes,
    selectedClass,
    onClassChange,
    sortBy,
    onSortChange,
    sortAsc,
    onSortDirectionToggle,
    showRegisteredOnly,
    onToggleRegisteredOnly,
  } = props

  /**
   * Handles class selection updates from the select control.
   * @param value Selected class or null.
   */
  const handleClassChange = (value: string | null) => {
    if (value)
      onClassChange(value)
  }

  /**
   * Handles sort field updates with runtime narrowing.
   * @param value Selected sort key or null.
   */
  const handleSortChange = (value: string | null) => {
    if (value && (value === 'lapTime' || value === 'driver' || value === 'laps')) {
      onSortChange(value)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-[120px]">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
          Class
        </label>
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {classes.map(cls => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[120px]">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
          Sort By
        </label>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Sort by">
              {SORT_OPTIONS.find(option => option.value === sortBy)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      <div className="order-last basis-full sm:order-none sm:basis-auto sm:flex-1 sm:min-w-[120px] flex items-end">
        <div className="flex items-center gap-2 h-7">
          <Checkbox
            id="show-registered"
            checked={showRegisteredOnly}
            onCheckedChange={onToggleRegisteredOnly}
          />
          <label
            htmlFor="show-registered"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Registered only
          </label>
        </div>
      </div>

      <div className="flex items-end shrink-0">
        <Button
          onClick={onSortDirectionToggle}
          variant="outline"
          size="icon-sm"
          title={sortAsc ? 'Ascending' : 'Descending'}
        >
          {sortAsc
            ? (
                <IconArrowUp className="h-4 w-4" />
              )
            : (
                <IconArrowDown className="h-4 w-4" />
              )}
        </Button>
      </div>
    </div>
  )
}
