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
        <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg border bg-card">
            <div className="flex-1 min-w-[140px]">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
                    Class
                </label>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                                {cls}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[140px]">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
                    Sort By
                </label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lapTime">Best Lap</SelectItem>
                        <SelectItem value="driver">Driver Name</SelectItem>
                        <SelectItem value="laps">Lap Count</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-end">
                <Button
                    onClick={onSortDirectionToggle}
                    variant="outline"
                    size="icon"
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
