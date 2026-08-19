import type { ServiceEntry } from '../../shared/types'
import { getEntry, updateEntry } from './entries'
import { getVehicle } from './vehicles'

function addDaysFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function clearReminder(entryId: number): ServiceEntry {
  const existing = getEntry(entryId)
  if (!existing) {
    throw new Error('Entry not found.')
  }

  return updateEntry(entryId, {
    nextDueDate: null,
    nextDueKm: null
  })
}

export function snoozeReminder(
  entryId: number,
  options: { days?: number; km?: number }
): ServiceEntry {
  const existing = getEntry(entryId)
  if (!existing) {
    throw new Error('Entry not found.')
  }

  const vehicle = getVehicle(existing.vehicleId)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }

  const patch: { nextDueDate?: string | null; nextDueKm?: number | null } = {}

  if (options.days != null) {
    patch.nextDueDate = addDaysFromToday(options.days)
  }

  if (options.km != null) {
    patch.nextDueKm = vehicle.currentKm + options.km
  }

  if (options.days == null && options.km == null) {
    throw new Error('Specify days or km to snooze.')
  }

  return updateEntry(entryId, patch)
}
