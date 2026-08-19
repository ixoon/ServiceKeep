import type { Vehicle } from '../../../shared/types'

export function vehicleSpecLine(vehicle: Vehicle): string {
  return [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ')
}

export function vehicleIdentityLine(vehicle: Vehicle): string {
  const vin = vehicle.vin ? `VIN ${vehicle.vin}` : null
  return [vehicle.licensePlate, vehicle.color, vin].filter(Boolean).join(' · ')
}
