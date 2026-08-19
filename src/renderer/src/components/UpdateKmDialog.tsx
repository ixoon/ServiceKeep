import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Vehicle } from '../../../shared/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApi } from '@/lib/api'
import { formatKm } from '@/lib/format'

interface Props {
  vehicle: Vehicle
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => Promise<void>
}

export default function UpdateKmDialog({ vehicle, open, onOpenChange, onUpdated }: Props) {
  const [km, setKm] = useState(String(vehicle.currentKm))
  const [logAsEntry, setLogAsEntry] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) {
      setKm(String(vehicle.currentKm))
      setLogAsEntry(false)
    }
    onOpenChange(next)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(km)
    if (Number.isNaN(value) || value < 0) {
      toast.error('Enter a valid km value.')
      return
    }

    setSaving(true)
    try {
      const api = getApi()
      await api.updateVehicle(vehicle.id, { currentKm: value })

      if (logAsEntry) {
        await api.createEntry({
          vehicleId: vehicle.id,
          category: 'other',
          title: 'Odometer reading',
          odometerKm: value,
          performedAt: new Date().toISOString()
        })
        toast.success('Odometer updated and logged as entry')
      } else {
        toast.success('Odometer updated')
      }

      handleOpenChange(false)
      await onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update km.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update odometer</DialogTitle>
          <DialogDescription>
            {vehicle.name} — current reading: {formatKm(vehicle.currentKm)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="update-km">New km reading</Label>
              <Input
                id="update-km"
                type="number"
                min="0"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                autoFocus
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={logAsEntry}
                onChange={(e) => setLogAsEntry(e.target.checked)}
              />
              <span>
                Also log as entry
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Off by default — only updates the vehicle odometer.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Update km'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
