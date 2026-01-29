import { Badge } from '@/components/ui/badge';

interface CarClassBadgeProps {
    carClass: string;
}

export function CarClassBadge({ carClass }: CarClassBadgeProps) {
    return (
        <Badge
            variant="secondary"
            className="uppercase text-xs font-semibold tracking-wide"
        >
            {carClass}
        </Badge>
    );
}
