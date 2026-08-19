import type { EntryCategory, ServiceEntry } from '../../../shared/types'

export interface EntryFilterState {
  search: string
  category: EntryCategory | 'all'
  dateFrom: string
  dateTo: string
  vehicleId: number | 'all'
}

export function createDefaultEntryFilters(
  activeVehicleId: number | null = null
): EntryFilterState {
  return {
    search: '',
    category: 'all',
    dateFrom: '',
    dateTo: '',
    vehicleId: activeVehicleId ?? 'all'
  }
}

export function filterEntries(
  entries: ServiceEntry[],
  filters: EntryFilterState
): ServiceEntry[] {
  const query = filters.search.trim().toLowerCase()

  return entries.filter((entry) => {
    if (filters.category !== 'all' && entry.category !== filters.category) {
      return false
    }

    if (filters.vehicleId !== 'all' && entry.vehicleId !== filters.vehicleId) {
      return false
    }

    const performedDate = entry.performedAt.slice(0, 10)
    if (filters.dateFrom && performedDate < filters.dateFrom) {
      return false
    }
    if (filters.dateTo && performedDate > filters.dateTo) {
      return false
    }

    if (query) {
      const haystack = `${entry.title} ${entry.comment ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) {
        return false
      }
    }

    return true
  })
}

export function hasActiveEntryFilters(filters: EntryFilterState): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.category !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.vehicleId !== 'all'
  )
}
