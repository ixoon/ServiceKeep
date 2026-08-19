export type EntryCategory =
  | 'oil'
  | 'small_service'
  | 'big_service'
  | 'parts'
  | 'tires'
  | 'registration'
  | 'insurance'
  | 'other'

export type ThemeMode = 'dark' | 'light'

export interface AppSettings {
  dataPath: string | null
  theme: ThemeMode
  activeVehicleId: number | null
  notificationsEnabled: boolean
  onboardingComplete: boolean
  lastBackupAt: string | null
  backupReminderDismissedAt: string | null
  lastNotificationAt: string | null
}

export type ReminderStatusFilter = 'all' | 'overdue' | 'due' | 'upcoming'

export interface IntervalOverride {
  nextDueKmOffset?: number | null
  nextDueDays?: number | null
}

export type IntervalOverrideMap = Partial<Record<string, IntervalOverride>>

export interface Vehicle {
  id: number
  name: string
  make: string | null
  model: string | null
  year: number | null
  currentKm: number
  fuelType: string | null
  engineNotes: string | null
  vin: string | null
  licensePlate: string | null
  color: string | null
  intervalOverrides: IntervalOverrideMap
  photoPath: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface VehicleInput {
  name: string
  make?: string | null
  model?: string | null
  year?: number | null
  currentKm?: number
  fuelType?: string | null
  engineNotes?: string | null
  vin?: string | null
  licensePlate?: string | null
  color?: string | null
  intervalOverrides?: IntervalOverrideMap
}

export interface ServiceEntry {
  id: number
  vehicleId: number
  category: EntryCategory
  title: string
  comment: string | null
  costEur: number | null
  odometerKm: number | null
  performedAt: string
  nextDueDate: string | null
  nextDueKm: number | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceEntryInput {
  vehicleId: number
  category: EntryCategory
  title: string
  comment?: string | null
  costEur?: number | null
  odometerKm?: number | null
  performedAt: string
  nextDueDate?: string | null
  nextDueKm?: number | null
}

export interface EntryImage {
  id: number
  entryId: number
  fileName: string
  relativePath: string
  mimeType: string | null
  sizeBytes: number | null
  caption: string | null
  createdAt: string
}

export interface VehicleGalleryImage extends EntryImage {
  entryTitle: string
  entryCategory: EntryCategory
  performedAt: string
}

export interface SearchHit {
  type: 'entry' | 'vehicle'
  id: number
  vehicleId: number
  vehicleName: string
  title: string
  snippet: string | null
  category: EntryCategory | null
  performedAt: string | null
}

export interface ReminderItem {
  entryId: number
  vehicleId: number
  vehicleName: string
  title: string
  category: EntryCategory
  nextDueDate: string | null
  nextDueKm: number | null
  currentKm: number
  isDue: boolean
  isOverdue: boolean
}

export interface SpendByVehicleRow {
  vehicleId: number
  vehicleName: string
  totalEur: number
}

export interface SpendByCategoryRow {
  category: EntryCategory
  totalEur: number
  entryCount: number
}

export interface SpendByMonthRow {
  year: number
  month: number
  totalEur: number
}

export interface VehicleCardSummary {
  vehicleId: number
  spentThisYear: number
  nextServiceTitle: string | null
  nextServiceDueDate: string | null
  nextServiceDueKm: number | null
  isNextOverdue: boolean
}

export const ENTRY_CATEGORIES: { id: EntryCategory; label: string }[] = [
  { id: 'oil', label: 'Oil' },
  { id: 'small_service', label: 'Small service' },
  { id: 'big_service', label: 'Big service' },
  { id: 'parts', label: 'Parts' },
  { id: 'tires', label: 'Tires' },
  { id: 'registration', label: 'Registration' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'other', label: 'Other' }
]
