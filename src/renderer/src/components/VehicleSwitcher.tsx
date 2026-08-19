import type { Vehicle } from '../../../shared/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  vehicles: Vehicle[]
  activeVehicleId: number | null
  onSelect: (id: number | null) => void
  allowAll?: boolean
}

export default function VehicleSwitcher({
  vehicles,
  activeVehicleId,
  onSelect,
  allowAll = true
}: Props) {
  if (vehicles.length === 0) {
    return null
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {allowAll ? (
        <Button
          type="button"
          size="sm"
          variant={activeVehicleId == null ? 'default' : 'outline'}
          onClick={() => onSelect(null)}
        >
          All vehicles
        </Button>
      ) : null}
      {vehicles.map((vehicle) => (
        <Button
          key={vehicle.id}
          type="button"
          size="sm"
          variant={activeVehicleId === vehicle.id ? 'default' : 'outline'}
          className={cn(activeVehicleId === vehicle.id && 'shadow-sm')}
          onClick={() => onSelect(vehicle.id)}
        >
          {vehicle.name}
        </Button>
      ))}
    </div>
  )
}
