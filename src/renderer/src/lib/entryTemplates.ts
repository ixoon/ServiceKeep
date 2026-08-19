import type { EntryCategory } from '../../../shared/types'
import type { EntryFormState } from './entryForm'
import { addDaysToDateString } from './entryForm'
import type { Vehicle } from '../../../shared/types'

export interface EntryTemplate {
  id: string
  label: string
  category: EntryCategory
  title: string
  nextDueKmOffset?: number
  nextDueDays?: number
}

export const ENTRY_TEMPLATES: EntryTemplate[] = [
  {
    id: 'oil',
    label: 'Oil change',
    category: 'oil',
    title: 'Oil + filter change',
    nextDueKmOffset: 10_000,
    nextDueDays: 365
  },
  {
    id: 'small_service',
    label: 'Small service',
    category: 'small_service',
    title: 'Small service',
    nextDueKmOffset: 15_000,
    nextDueDays: 365
  },
  {
    id: 'big_service',
    label: 'Big service',
    category: 'big_service',
    title: 'Big service',
    nextDueKmOffset: 60_000,
    nextDueDays: 730
  },
  {
    id: 'parts',
    label: 'Part replacement',
    category: 'parts',
    title: 'Part replacement'
  }
]

export function applyEntryTemplate(template: EntryTemplate, vehicle: Vehicle): EntryFormState {
  const { nextDueKmOffset, nextDueDays } = resolveTemplateOffsets(template, vehicle)
  const nextDueDate =
    nextDueDays != null ? addDaysToDateString(nextDueDays) : ''
  const nextDueKm =
    nextDueKmOffset != null
      ? String(vehicle.currentKm + nextDueKmOffset)
      : ''

  return {
    vehicleId: String(vehicle.id),
    category: template.category,
    title: template.title,
    comment: '',
    costEur: '',
    odometerKm: String(vehicle.currentKm),
    performedAt: new Date().toISOString().slice(0, 10),
    nextDueDate,
    nextDueKm,
    partNumber: '',
    partBrand: '',
    oldCondition: '',
    installationNotes: '',
    workshop: ''
  }
}

export function findEntryTemplate(id: string): EntryTemplate | undefined {
  return ENTRY_TEMPLATES.find((template) => template.id === id)
}

export const INTERVAL_TEMPLATES = ENTRY_TEMPLATES.filter(
  (template) => template.nextDueKmOffset != null || template.nextDueDays != null
)

export function resolveTemplateOffsets(
  template: EntryTemplate,
  vehicle: Vehicle
): { nextDueKmOffset?: number; nextDueDays?: number } {
  const override = vehicle.intervalOverrides?.[template.id]
  return {
    nextDueKmOffset: override?.nextDueKmOffset ?? template.nextDueKmOffset,
    nextDueDays: override?.nextDueDays ?? template.nextDueDays
  }
}
