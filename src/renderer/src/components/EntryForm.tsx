import type { FormEvent } from 'react'
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type Vehicle
} from '../../../shared/types'
import type { EntryFormState } from '@/lib/entryForm'
import { isPartLikeCategory } from '@/lib/entryForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  form: EntryFormState
  vehicles: Vehicle[]
  onChange: (form: EntryFormState) => void
  onSubmit: (event: FormEvent) => void
  saving?: boolean
  error?: string | null
  showVehicleSelect?: boolean
  submitLabel?: string
  showPhotoHint?: boolean
}

export default function EntryForm({
  form,
  vehicles,
  onChange,
  onSubmit,
  saving = false,
  error = null,
  showVehicleSelect = true,
  submitLabel = 'Save & add photos',
  showPhotoHint = true
}: Props) {
  const showPartFields = isPartLikeCategory(form.category)

  function setField<K extends keyof EntryFormState>(key: K, value: EntryFormState[K]) {
    onChange({ ...form, [key]: value })
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">What was done</h3>
          <p className="text-xs text-muted-foreground">Basic info about the work or replacement.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {showVehicleSelect ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(value) => setField('vehicleId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                      {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setField('category', value as EntryCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-performedAt">Date performed</Label>
            <Input
              id="entry-performedAt"
              type="date"
              value={form.performedAt}
              onChange={(e) => setField('performedAt', e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={showPartFields ? 'Front brake pads' : 'Oil + filter change'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-odometerKm">Odometer (km)</Label>
            <Input
              id="entry-odometerKm"
              type="number"
              min="0"
              value={form.odometerKm}
              onChange={(e) => setField('odometerKm', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-costEur">Cost (EUR)</Label>
            <Input
              id="entry-costEur"
              type="number"
              min="0"
              step="0.01"
              value={form.costEur}
              onChange={(e) => setField('costEur', e.target.value)}
            />
          </div>
        </div>
      </section>

      {showPartFields ? (
        <>
          <Separator />
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Part details</h3>
              <p className="text-xs text-muted-foreground">
                Describe the part — number, condition, how it was replaced.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entry-partNumber">Part number</Label>
                <Input
                  id="entry-partNumber"
                  value={form.partNumber}
                  onChange={(e) => setField('partNumber', e.target.value)}
                  placeholder="OEM or aftermarket ref."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-partBrand">Brand / manufacturer</Label>
                <Input
                  id="entry-partBrand"
                  value={form.partBrand}
                  onChange={(e) => setField('partBrand', e.target.value)}
                  placeholder="Bosch, Mann, OEM…"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="entry-oldCondition">Old part condition</Label>
                <Textarea
                  id="entry-oldCondition"
                  value={form.oldCondition}
                  onChange={(e) => setField('oldCondition', e.target.value)}
                  placeholder="How it looked — wear, damage, why it was replaced…"
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="entry-installationNotes">Installation notes</Label>
                <Textarea
                  id="entry-installationNotes"
                  value={form.installationNotes}
                  onChange={(e) => setField('installationNotes', e.target.value)}
                  placeholder="Torque specs, extra steps, what was cleaned or adjusted…"
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="entry-workshop">Workshop / who did it</Label>
                <Input
                  id="entry-workshop"
                  value={form.workshop}
                  onChange={(e) => setField('workshop', e.target.value)}
                  placeholder="DIY, local garage, dealer…"
                />
              </div>
            </div>
          </section>
        </>
      ) : null}

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Reminder & notes</h3>
          <p className="text-xs text-muted-foreground">Optional — set the next service or add extra notes.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entry-nextDueDate">Next due date</Label>
            <Input
              id="entry-nextDueDate"
              type="date"
              value={form.nextDueDate}
              onChange={(e) => setField('nextDueDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-nextDueKm">Next due km</Label>
            <Input
              id="entry-nextDueKm"
              type="number"
              min="0"
              value={form.nextDueKm}
              onChange={(e) => setField('nextDueKm', e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="entry-comment">Additional notes</Label>
            <Textarea
              id="entry-comment"
              value={form.comment}
              onChange={(e) => setField('comment', e.target.value)}
              placeholder="Anything else worth remembering…"
              rows={2}
            />
          </div>
        </div>
      </section>

      {showPhotoHint ? (
        <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          After saving, you can attach photos — old part, new part, installed result, and receipt.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
