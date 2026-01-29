import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';

interface LeaderboardFiltersProps {
    classes: string[];
    selectedClass: string;
    onClassChange: (value: string) => void;
    sortBy: 'lapTime' | 'driver' | 'laps';
    onSortChange: (value: 'lapTime' | 'driver' | 'laps') => void;
    sortAsc: boolean;
    onSortDirectionToggle: () => void;
}

const SORT_OPTIONS = [
    { value: 'lapTime', label: 'Best Lap' },
    { value: 'driver', label: 'Driver Name' },
    { value: 'laps', label: 'Lap Count' },
] as const;

export function LeaderboardFilters({
    classes,
    selectedClass,
    onClassChange,
    sortBy,
    onSortChange,
    sortAsc,
    onSortDirectionToggle,
}: LeaderboardFiltersProps) {
    const handleClassChange = (value: string | null) => {
        if (value) onClassChange(value);
    };

    const handleSortChange = (value: string | null) => {
        if (value && (value === 'lapTime' || value === 'driver' || value === 'laps')) {
            onSortChange(value);
        }
    };

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
                        {classes.map((cls) => (
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
                            {SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-end">
                <Button
                    onClick={onSortDirectionToggle}
                    variant="outline"
                    size="icon-sm"
                    title={sortAsc ? 'Ascending' : 'Descending'}
                >
                    {sortAsc ? (
                        <IconArrowUp className="h-4 w-4" />
                    ) : (
                        <IconArrowDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
