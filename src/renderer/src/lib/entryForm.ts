import type { EntryCategory, Vehicle } from '../../../shared/types'

export interface EntryFormState {
  vehicleId: string
  category: EntryCategory
  title: string
  comment: string
  costEur: string
  odometerKm: string
  performedAt: string
  nextDueDate: string
  nextDueKm: string
  partNumber: string
  partBrand: string
  oldCondition: string
  installationNotes: string
  workshop: string
}

export function createEmptyEntryForm(vehicleId?: number | null): EntryFormState {
  return {
    vehicleId: vehicleId != null ? String(vehicleId) : '',
    category: 'parts',
    title: '',
    comment: '',
    costEur: '',
    odometerKm: '',
    performedAt: new Date().toISOString().slice(0, 10),
    nextDueDate: '',
    nextDueKm: '',
    partNumber: '',
    partBrand: '',
    oldCondition: '',
    installationNotes: '',
    workshop: ''
  }
}

export function entryFormWithVehicleDefaults(
  vehicle: Vehicle,
  overrides: Partial<EntryFormState> = {}
): EntryFormState {
  return {
    ...createEmptyEntryForm(vehicle.id),
    odometerKm: String(vehicle.currentKm),
    ...overrides
  }
}

export function addDaysToDateString(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function isPartLikeCategory(category: EntryCategory): boolean {
  return category === 'parts' || category === 'tires'
}

export function buildEntryComment(form: EntryFormState): string | null {
  const lines: string[] = []

  if (form.partNumber.trim()) lines.push(`Part #: ${form.partNumber.trim()}`)
  if (form.partBrand.trim()) lines.push(`Brand: ${form.partBrand.trim()}`)
  if (form.oldCondition.trim()) lines.push(`Old condition: ${form.oldCondition.trim()}`)
  if (form.installationNotes.trim()) lines.push(`Installation: ${form.installationNotes.trim()}`)
  if (form.workshop.trim()) lines.push(`Workshop: ${form.workshop.trim()}`)
  if (form.comment.trim()) lines.push(form.comment.trim())

  return lines.length > 0 ? lines.join('\n') : null
}

export function entryInputFromForm(form: EntryFormState, vehicleId: number) {
  return {
    vehicleId,
    category: form.category,
    title: form.title.trim(),
    comment: buildEntryComment(form),
    costEur: form.costEur ? Number(form.costEur) : null,
    odometerKm: form.odometerKm ? Number(form.odometerKm) : null,
    performedAt: new Date(form.performedAt).toISOString(),
    nextDueDate: form.nextDueDate ? new Date(form.nextDueDate).toISOString() : null,
    nextDueKm: form.nextDueKm ? Number(form.nextDueKm) : null
  }
}
