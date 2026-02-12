// @anchor: leaderboard/features/class-badge-ui
// @intent: Visual badge for displaying entry car class.
import { Badge } from '@/components/ui/badge'

interface CarClassBadgeProps {
  carClass: string
}

/**
 * Renders the car class badge.
 * @param props Component props object.
 * @param props.carClass Car class label to show.
 * @returns Styled class badge.
 */
export function CarClassBadge(props: CarClassBadgeProps) {
  const { carClass } = props

  return (
    <Badge
      variant="secondary"
      className="uppercase text-xs font-semibold tracking-wide"
    >
      {carClass}
    </Badge>
  )
}
