import { X } from 'lucide-react'
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type Vehicle
} from '../../../shared/types'
import type { EntryFilterState } from '@/lib/entryFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Props {
  filters: EntryFilterState
  vehicles: Vehicle[]
  onChange: (filters: EntryFilterState) => void
  onClear: () => void
  showClear: boolean
}

export default function EntryFiltersBar({
  filters,
  vehicles,
  onChange,
  onClear,
  showClear
}: Props) {
  function setField<K extends keyof EntryFilterState>(key: K, value: EntryFilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Filters</p>
        {showClear ? (
          <Button variant="ghost" size="sm" className="gap-1" onClick={onClear}>
            <X className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="entry-search">Search</Label>
          <Input
            id="entry-search"
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Title or comment…"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Vehicle</Label>
          <Select
            value={filters.vehicleId === 'all' ? 'all' : String(filters.vehicleId)}
            onValueChange={(value) =>
              setField('vehicleId', value === 'all' ? 'all' : Number(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                  {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => setField('category', value as EntryCategory | 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ENTRY_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-date-from">From date</Label>
          <Input
            id="entry-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setField('dateFrom', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-date-to">To date</Label>
          <Input
            id="entry-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setField('dateTo', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
