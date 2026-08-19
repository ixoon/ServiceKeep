import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type {
  IntervalOverrideMap,
  ReminderItem,
  ServiceEntry,
  Vehicle,
  VehicleGalleryImage
} from '../../../shared/types'
import EntryDetailSheet from '@/components/EntryDetailSheet'
import EntryFormSheet from '@/components/EntryFormSheet'
import EntryTimeline from '@/components/EntryTimeline'
import OverdueBanner from '@/components/OverdueBanner'
import QuickAddBar from '@/components/QuickAddBar'
import QuickKmBar from '@/components/QuickKmBar'
import VehicleIntervalFields from '@/components/VehicleIntervalFields'
import VehiclePhotoGallery from '@/components/VehiclePhotoGallery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { findEntryTemplate } from '@/lib/entryTemplates'
import type { EntryTemplate } from '@/lib/entryTemplates'
import { getApi } from '@/lib/api'
import { formatDate, formatKm } from '@/lib/format'
import { vehicleIdentityLine, vehicleSpecLine } from '@/lib/vehicleIdentity'

interface Props {
  vehicles: Vehicle[]
  onChange: () => Promise<void>
  onSelectVehicle: (id: number | null) => void
}

export default function VehicleDetailPage({ vehicles, onChange, onSelectVehicle }: Props) {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const vehicleId = Number(id)

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [entries, setEntries] = useState<ServiceEntry[]>([])
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [gallery, setGallery] = useState<VehicleGalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIntervals, setSavingIntervals] = useState(false)
  const [intervalDraft, setIntervalDraft] = useState<IntervalOverrideMap>({})

  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [entryTemplateId, setEntryTemplateId] = useState<string | null>(null)
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function reload() {
    if (!vehicleId || Number.isNaN(vehicleId)) return

    setLoading(true)
    try {
      const api = getApi()
      const [loadedVehicle, entryList, reminderList, galleryList] = await Promise.all([
        api.getVehicle(vehicleId),
        api.listEntries(vehicleId),
        api.listReminders(),
        api.listVehicleImages(vehicleId)
      ])
      setVehicle(loadedVehicle)
      setEntries(entryList)
      setReminders(reminderList.filter((item) => item.vehicleId === vehicleId))
      setGallery(galleryList)
      setIntervalDraft(loadedVehicle?.intervalOverrides ?? {})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [vehicleId, vehicles])

  useEffect(() => {
    if (vehicle) {
      void onSelectVehicle(vehicle.id)
    }
  }, [vehicle?.id])

  useEffect(() => {
    const entryParam = searchParams.get('entry')
    if (!entryParam) return
    const parsed = Number(entryParam)
    if (!Number.isNaN(parsed)) {
      setDetailEntryId(parsed)
      setDetailOpen(true)
    }
    const next = new URLSearchParams(searchParams)
    next.delete('entry')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const dueReminders = useMemo(
    () => reminders.filter((item) => item.isDue),
    [reminders]
  )

  const overdueCount = dueReminders.filter((item) => item.isOverdue).length

  function openEntryForm(template?: EntryTemplate) {
    setEntryTemplateId(template?.id ?? null)
    setEntryFormOpen(true)
  }

  function openEntryDetail(entryId: number) {
    setDetailEntryId(entryId)
    setDetailOpen(true)
  }

  async function saveIntervals() {
    if (!vehicle) return
    setSavingIntervals(true)
    try {
      await getApi().updateVehicle(vehicle.id, { intervalOverrides: intervalDraft })
      toast.success('Service intervals updated')
      await onChange()
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save intervals.')
    } finally {
      setSavingIntervals(false)
    }
  }

  if (Number.isNaN(vehicleId)) {
    return <Navigate to="/vehicles" replace />
  }

  if (!loading && !vehicle) {
    return <Navigate to="/vehicles" replace />
  }

  const subtitle = vehicle ? vehicleSpecLine(vehicle) || 'No make/model' : ''
  const identity = vehicle ? vehicleIdentityLine(vehicle) : ''

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1" asChild>
          <Link to="/vehicles">
            <ArrowLeft className="size-4" />
            Back to garage
          </Link>
        </Button>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : vehicle ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{vehicle.name}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
              {identity ? <p className="text-sm text-muted-foreground">{identity}</p> : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={async () => {
                const path = await getApi().exportVehiclePdf(vehicle.id)
                if (path) toast.success('PDF exported', { description: path })
              }}
            >
              <FileText className="size-4" />
              Export PDF
            </Button>
          </div>
        ) : null}
      </div>

      {vehicle ? (
        <QuickKmBar
          vehicle={vehicle}
          onUpdated={async () => {
            await onChange()
            await reload()
          }}
        />
      ) : null}

      {vehicle ? (
        <QuickAddBar
          vehicle={vehicle}
          onSelectTemplate={(template) => openEntryForm(template)}
          onOther={() => openEntryForm()}
        />
      ) : null}

      <OverdueBanner overdueCount={overdueCount} dueCount={dueReminders.length} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Reminders</CardTitle>
            <CardDescription>Due and overdue items for this vehicle.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : dueReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear — nothing due right now.</p>
            ) : (
              <ul className="space-y-3">
                {dueReminders.map((item) => (
                  <li key={item.entryId}>
                    <button
                      type="button"
                      className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() => openEntryDetail(item.entryId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{item.title}</p>
                        <Badge variant={item.isOverdue ? 'destructive' : 'secondary'}>
                          {item.isOverdue ? 'Overdue' : 'Due'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item.nextDueDate)} · {formatKm(item.nextDueKm)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Service timeline</CardTitle>
            <CardDescription>Recent maintenance and costs — click an entry for details.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <EntryTimeline entries={entries} onSelect={openEntryDetail} />
            )}
          </CardContent>
        </Card>
      </div>

      {vehicle ? (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service intervals</CardTitle>
              <CardDescription>
                Override default oil/service templates for this vehicle. Used when you quick-add an
                entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VehicleIntervalFields
                vehicle={vehicle}
                value={intervalDraft}
                onChange={setIntervalDraft}
              />
              <Button onClick={() => void saveIntervals()} disabled={savingIntervals}>
                {savingIntervals ? 'Saving…' : 'Save intervals'}
              </Button>
            </CardContent>
          </Card>

          <VehiclePhotoGallery
            images={gallery}
            loading={loading}
            onSelectEntry={openEntryDetail}
          />
        </div>
      ) : null}

      {vehicle ? (
        <EntryFormSheet
          open={entryFormOpen}
          onOpenChange={setEntryFormOpen}
          vehicles={vehicles}
          vehicle={vehicle}
          initialTemplate={entryTemplateId ? findEntryTemplate(entryTemplateId) ?? null : null}
          onSaved={(entryId) => {
            void reload()
            openEntryDetail(entryId)
          }}
          onChange={async () => {
            await onChange()
            await reload()
          }}
        />
      ) : null}

      <EntryDetailSheet
        entryId={detailEntryId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={async () => {
          await onChange()
          await reload()
        }}
      />
    </div>
  )
}
