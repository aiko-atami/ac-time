import { Badge } from '@/components/ui/badge';
import { getClassColor } from '@/lib/utils';

interface CarClassBadgeProps {
    carClass: string;
}

export function CarClassBadge({ carClass }: CarClassBadgeProps) {
    const color = getClassColor(carClass);

    return (
        <Badge
            className="uppercase text-xs font-semibold tracking-wide border"
            style={{
                backgroundColor: `${color}20`,
                color: color,
                borderColor: `${color}40`,
            }}
        >
            {carClass}
        </Badge>
    );
}
