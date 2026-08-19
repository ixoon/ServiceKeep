import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Vehicle } from '../../../shared/types'
import type { EntryFormState } from '@/lib/entryForm'
import { createEmptyEntryForm, entryInputFromForm } from '@/lib/entryForm'
import type { EntryTemplate } from '@/lib/entryTemplates'
import { applyEntryTemplate } from '@/lib/entryTemplates'
import EntryForm from '@/components/EntryForm'
import QuickAddTemplates from '@/components/QuickAddTemplates'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { getApi } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  vehicle: Vehicle | null
  initialTemplate?: EntryTemplate | null
  completeReminderEntryId?: number | null
  onSaved: (entryId: number) => void
  onChange: () => Promise<void>
}

export default function EntryFormSheet({
  open,
  onOpenChange,
  vehicles,
  vehicle,
  initialTemplate = null,
  completeReminderEntryId = null,
  onSaved,
  onChange
}: Props) {
  const [form, setForm] = useState<EntryFormState>(createEmptyEntryForm())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (vehicle && initialTemplate) {
      setForm(applyEntryTemplate(initialTemplate, vehicle))
    } else if (vehicle) {
      setForm(createEmptyEntryForm(vehicle.id))
    } else {
      setForm(createEmptyEntryForm())
    }
    setError(null)
  }, [open, vehicle, initialTemplate])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const vehicleId = Number(form.vehicleId || vehicle?.id)
    if (!vehicleId) {
      setError('Select a vehicle first.')
      return
    }
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    try {
      const created = await getApi().createEntry(entryInputFromForm(form, vehicleId))

      if (completeReminderEntryId != null) {
        await getApi().clearReminder(completeReminderEntryId)
      }

      toast.success('Entry saved')
      onOpenChange(false)
      await onChange()
      onSaved(created.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save entry.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b px-4 py-4">
          <SheetTitle>New entry</SheetTitle>
          <SheetDescription>
            Log maintenance work and optionally set the next reminder.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 pb-8">
          {vehicle ? (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quick add
              </p>
              <QuickAddTemplates
                compact
                onSelect={(template) => setForm(applyEntryTemplate(template, vehicle))}
              />
            </div>
          ) : null}

          <EntryForm
            form={form}
            vehicles={vehicles}
            onChange={setForm}
            onSubmit={onSubmit}
            saving={saving}
            error={error}
            showVehicleSelect={vehicle == null}
          />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
