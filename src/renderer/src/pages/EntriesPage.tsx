import { useEffect, useMemo, useState } from 'react'
import { Archive, Camera, Download, Pencil, RotateCcw, Trash2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceEntry, Vehicle } from '../../../shared/types'
import EmptyState from '../components/EmptyState'
import EntryComposer from '../components/EntryComposer'
import EntryDetailSheet from '../components/EntryDetailSheet'
import EntryFiltersBar from '../components/EntryFiltersBar'
import PageHeader from '../components/PageHeader'
import QuickKmBar from '../components/QuickKmBar'
import VehicleSwitcher from '../components/VehicleSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createDefaultEntryFilters,
  filterEntries,
  hasActiveEntryFilters,
  type EntryFilterState
} from '@/lib/entryFilters'
import { getApi } from '@/lib/api'
import { formatCategory, formatDate, formatEur, formatKm } from '@/lib/format'

interface Props {
  vehicles: Vehicle[]
  activeVehicleId: number | null
  onSelectVehicle: (id: number | null) => void
  onChange: () => Promise<void>
}

export default function EntriesPage({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onChange
}: Props) {
  const [allEntries, setAllEntries] = useState<ServiceEntry[]>([])
  const [imageCounts, setImageCounts] = useState<Record<number, number>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [filters, setFilters] = useState<EntryFilterState>(() =>
    createDefaultEntryFilters(activeVehicleId)
  )
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailEditMode, setDetailEditMode] = useState(false)

  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      vehicleId: activeVehicleId ?? 'all'
    }))
  }, [activeVehicleId])

  async function reload() {
    const api = getApi()
    const list = showArchived
      ? (await api.listEntries(undefined, true)).filter((entry) => entry.archivedAt != null)
      : await api.listEntries(undefined, false)

    setAllEntries(list)

    const counts: Record<number, number> = {}
    await Promise.all(
      list.map(async (entry) => {
        const images = await api.listImages(entry.id)
        counts[entry.id] = images.length
      })
    )
    setImageCounts(counts)
  }

  useEffect(() => {
    void reload()
  }, [vehicles, showArchived])

  const filteredEntries = useMemo(
    () => filterEntries(allEntries, filters),
    [allEntries, filters]
  )

  const vehicleNameById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name])),
    [vehicles]
  )

  function openEntryDetail(entryId: number, edit = false) {
    setDetailEntryId(entryId)
    setDetailEditMode(edit)
    setDetailOpen(true)
  }

  function handleDetailOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) {
      setDetailEditMode(false)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div>
        <PageHeader
          title="Service log"
          description="Document maintenance, part replacements, and photo evidence."
        />
        <EmptyState
          icon={Wrench}
          title="Add a vehicle first"
          description="You need at least one vehicle before logging entries."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service log"
        description="Log work with full details and photos — old part, replacement, installation."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              const path = await getApi().exportEntriesCsv(activeVehicleId)
              if (path) toast.success('Entries exported', { description: path })
            }}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      {!showArchived ? (
        <>
          <VehicleSwitcher
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelect={onSelectVehicle}
          />

          <QuickKmBar
            vehicle={activeVehicle}
            onUpdated={async () => {
              await onChange()
              await reload()
            }}
          />

          <Card>
            <CardContent className="pt-6">
              <EntryComposer
                vehicles={vehicles}
                activeVehicle={activeVehicle}
                activeVehicleId={activeVehicleId}
                onSaved={async () => {
                  await reload()
                  await onChange()
                }}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{showArchived ? 'Archive' : 'History'}</CardTitle>
            <CardDescription>
              {showArchived
                ? 'Archived entries — restore or delete permanently.'
                : 'Filter, search, and click an entry to view or edit details and photos.'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((prev) => !prev)}
          >
            {showArchived ? 'Back to history' : 'Show archive'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <EntryFiltersBar
            filters={filters}
            vehicles={vehicles}
            onChange={setFilters}
            onClear={() => setFilters(createDefaultEntryFilters(activeVehicleId))}
            showClear={hasActiveEntryFilters(filters)}
          />

          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={showArchived ? Archive : Wrench}
              title={
                showArchived
                  ? allEntries.length === 0
                    ? 'Archive is empty'
                    : 'No matching archived entries'
                  : allEntries.length === 0
                    ? 'No entries yet'
                    : 'No matching entries'
              }
              description={
                showArchived
                  ? allEntries.length === 0
                    ? 'Archived entries will appear here.'
                    : 'Try adjusting your filters or search query.'
                  : allEntries.length === 0
                    ? 'Use the form above to log your first service or part replacement.'
                    : 'Try adjusting your filters or search query.'
              }
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Showing {filteredEntries.length} of {allEntries.length}{' '}
                {showArchived ? 'archived' : ''} entries
              </p>
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 ${
                    showArchived ? 'opacity-80' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openEntryDetail(entry.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{entry.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {formatCategory(entry.category)}
                      </Badge>
                      {showArchived ? (
                        <Badge variant="outline" className="text-xs">
                          Archived {formatDate(entry.archivedAt)}
                        </Badge>
                      ) : null}
                      {(imageCounts[entry.id] ?? 0) > 0 ? (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Camera className="size-3" />
                          {imageCounts[entry.id]}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vehicleNameById.get(entry.vehicleId) ?? 'Unknown vehicle'} ·{' '}
                      {formatDate(entry.performedAt)} · {formatKm(entry.odometerKm)} ·{' '}
                      {formatEur(entry.costEur)}
                    </p>
                    {entry.comment ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.comment}</p>
                    ) : null}
                  </button>

                  <div className="flex shrink-0 gap-1">
                    {showArchived ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={async () => {
                            await getApi().restoreEntry(entry.id)
                            toast.success('Entry restored')
                            await reload()
                            await onChange()
                          }}
                          title="Restore"
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Permanently delete "${entry.title}"? This cannot be undone.`
                              )
                            ) {
                              return
                            }
                            await getApi().deleteEntryPermanent(entry.id)
                            toast.success('Entry deleted permanently')
                            await reload()
                            await onChange()
                          }}
                          title="Delete permanently"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => openEntryDetail(entry.id, true)}
                          title="Edit entry"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            await getApi().archiveEntry(entry.id)
                            toast.success('Entry archived')
                            await reload()
                            await onChange()
                          }}
                          title="Archive"
                        >
                          <Archive className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EntryDetailSheet
        entryId={detailEntryId}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        initialEdit={detailEditMode}
        onChanged={async () => {
          await reload()
          await onChange()
        }}
      />
    </div>
  )
}
