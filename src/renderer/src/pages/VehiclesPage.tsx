import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Car, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { IntervalOverrideMap, Vehicle, VehicleCardSummary } from '../../../shared/types'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import VehicleCard from '../components/VehicleCard'
import VehicleIntervalFields from '../components/VehicleIntervalFields'
import VehicleSwitcher from '../components/VehicleSwitcher'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApi } from '@/lib/api'

interface Props {
  vehicles: Vehicle[]
  activeVehicleId: number | null
  onSelectVehicle: (id: number | null) => void
  onChange: () => Promise<void>
}

const emptyForm = {
  name: '',
  make: '',
  model: '',
  year: '',
  currentKm: '',
  fuelType: '',
  engineNotes: '',
  vin: '',
  licensePlate: '',
  color: '',
  intervalOverrides: {} as IntervalOverrideMap
}

export default function VehiclesPage({
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onChange
}: Props) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archived, setArchived] = useState<Vehicle[]>([])
  const [summaries, setSummaries] = useState<VehicleCardSummary[]>([])
  const [saving, setSaving] = useState(false)
  const location = useLocation()

  const currentYear = new Date().getFullYear()

  async function loadSummaries() {
    const rows = await getApi().getVehicleCardSummaries(currentYear)
    setSummaries(rows)
  }

  async function loadArchived(next = showArchived) {
    if (!next) {
      setArchived([])
      return
    }
    const all = await getApi().listVehicles(true)
    setArchived(all.filter((vehicle) => vehicle.archivedAt != null))
  }

  useEffect(() => {
    void loadSummaries()
  }, [vehicles, location.key])

  useEffect(() => {
    function onFocus() {
      void loadSummaries()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [vehicles.length])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    const payload = {
      name: form.name.trim(),
      make: form.make || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      currentKm: form.currentKm ? Number(form.currentKm) : 0,
      fuelType: form.fuelType || null,
      engineNotes: form.engineNotes || null,
      vin: form.vin || null,
      licensePlate: form.licensePlate || null,
      color: form.color || null,
      intervalOverrides: form.intervalOverrides
    }

    setSaving(true)
    try {
      const api = getApi()
      if (editingId != null) {
        await api.updateVehicle(editingId, payload)
        toast.success('Vehicle updated')
      } else {
        await api.createVehicle(payload)
        toast.success('Vehicle added')
      }
      setForm(emptyForm)
      setEditingId(null)
      await onChange()
      await loadArchived()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save vehicle.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id)
    setForm({
      name: vehicle.name,
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year?.toString() ?? '',
      currentKm: vehicle.currentKm.toString(),
      fuelType: vehicle.fuelType ?? '',
      engineNotes: vehicle.engineNotes ?? '',
      vin: vehicle.vin ?? '',
      licensePlate: vehicle.licensePlate ?? '',
      color: vehicle.color ?? '',
      intervalOverrides: vehicle.intervalOverrides ?? {}
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  function summaryFor(vehicleId: number): VehicleCardSummary | null {
    return summaries.find((item) => item.vehicleId === vehicleId) ?? null
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Your garage at a glance — km, next service, and spend this year."
      />

      <VehicleSwitcher
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelect={onSelectVehicle}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit vehicle' : 'Add vehicle'}</CardTitle>
            <CardDescription>
              Name is required. Add a photo from the garage card after saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Name / label</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Daily driver"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentKm">Current km</Label>
                  <Input
                    id="currentKm"
                    type="number"
                    min="0"
                    value={form.currentKm}
                    onChange={(e) => setForm((prev) => ({ ...prev, currentKm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={form.make}
                    onChange={(e) => setForm((prev) => ({ ...prev, make: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fuelType">Fuel type</Label>
                  <Input
                    id="fuelType"
                    value={form.fuelType}
                    onChange={(e) => setForm((prev) => ({ ...prev, fuelType: e.target.value }))}
                    placeholder="Diesel / Petrol / Hybrid"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN / chassis number</Label>
                  <Input
                    id="vin"
                    value={form.vin}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, vin: e.target.value.toUpperCase() }))
                    }
                    placeholder="WVWZZZ1JZXW000000"
                    autoCapitalize="characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License plate</Label>
                  <Input
                    id="licensePlate"
                    value={form.licensePlate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        licensePlate: e.target.value.toUpperCase()
                      }))
                    }
                    placeholder="BG-123-AB"
                    autoCapitalize="characters"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="Black / Reflex Silver"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="engineNotes">Engine / oil notes</Label>
                  <Textarea
                    id="engineNotes"
                    value={form.engineNotes}
                    onChange={(e) => setForm((prev) => ({ ...prev, engineNotes: e.target.value }))}
                    placeholder="5W-30, filter part numbers, etc."
                  />
                </div>
                <div className="sm:col-span-2">
                  <VehicleIntervalFields
                    vehicle={editingId != null ? vehicles.find((item) => item.id === editingId) : null}
                    value={form.intervalOverrides}
                    onChange={(intervalOverrides) =>
                      setForm((prev) => ({ ...prev, intervalOverrides }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add vehicle'}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>

            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Garage</h2>
              <p className="text-sm text-muted-foreground">Active vehicles in your log.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const next = !showArchived
                setShowArchived(next)
                await loadArchived(next)
              }}
            >
              {showArchived ? 'Hide archive' : 'Show archive'}
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No vehicles yet"
              description="Add your first vehicle using the form on the left."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  summary={summaryFor(vehicle.id)}
                  isActive={activeVehicleId === vehicle.id}
                  onEdit={() => startEdit(vehicle)}
                  onSetActive={() => void onSelectVehicle(vehicle.id)}
                  onArchive={async () => {
                    await getApi().archiveVehicle(vehicle.id)
                    if (activeVehicleId === vehicle.id) {
                      await onSelectVehicle(null)
                    }
                    toast.success('Vehicle archived')
                    await onChange()
                    await loadArchived()
                  }}
                  onPhotoChanged={async () => {
                    await onChange()
                    await loadSummaries()
                  }}
                />
              ))}
            </div>
          )}

          {showArchived ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Archived</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {archived.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Archive is empty.</p>
                ) : (
                  archived.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm font-medium">{vehicle.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={async () => {
                            await getApi().restoreVehicle(vehicle.id)
                            toast.success('Vehicle restored')
                            await onChange()
                            await loadArchived()
                          }}
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Permanently delete ${vehicle.name}? This cannot be undone.`
                              )
                            ) {
                              return
                            }
                            await getApi().deleteVehiclePermanent(vehicle.id)
                            toast.success('Vehicle deleted')
                            await onChange()
                            await loadArchived()
                          }}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
