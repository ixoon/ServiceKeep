import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { EntryImage, Vehicle } from '../../../shared/types'
import EntryForm from '@/components/EntryForm'
import PhotoDocumentation from '@/components/PhotoDocumentation'
import QuickAddTemplates from '@/components/QuickAddTemplates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  createEmptyEntryForm,
  entryInputFromForm,
  type EntryFormState
} from '@/lib/entryForm'
import { applyEntryTemplate, type EntryTemplate } from '@/lib/entryTemplates'
import { getApi } from '@/lib/api'

interface Props {
  vehicles: Vehicle[]
  activeVehicle: Vehicle | null
  activeVehicleId: number | null
  onSaved: () => Promise<void>
}

type Step = 'details' | 'photos'

export default function EntryComposer({
  vehicles,
  activeVehicle,
  activeVehicleId,
  onSaved
}: Props) {
  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState<EntryFormState>(createEmptyEntryForm(activeVehicleId))
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null)
  const [savedTitle, setSavedTitle] = useState('')
  const [images, setImages] = useState<EntryImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (step === 'details' && activeVehicleId != null) {
      setForm((prev) => ({
        ...prev,
        vehicleId: String(activeVehicleId),
        odometerKm: prev.odometerKm || String(activeVehicle?.currentKm ?? '')
      }))
    }
  }, [activeVehicleId, activeVehicle?.currentKm, step])

  async function loadImages(entryId: number) {
    const list = await getApi().listImages(entryId)
    setImages(list)
  }

  function resetComposer() {
    setStep('details')
    setForm(createEmptyEntryForm(activeVehicleId))
    setSavedEntryId(null)
    setSavedTitle('')
    setImages([])
    setError(null)
  }

  function applyTemplate(template: EntryTemplate) {
    if (activeVehicle) {
      setForm(applyEntryTemplate(template, activeVehicle))
      return
    }
    setForm((prev) => ({
      ...prev,
      category: template.category,
      title: template.title
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const vehicleId = Number(form.vehicleId || activeVehicleId)
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
      setSavedEntryId(created.id)
      setSavedTitle(created.title)
      await loadImages(created.id)
      setStep('photos')
      toast.success('Entry saved — add photos')
      await onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save entry.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (step === 'photos' && savedEntryId != null) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Step 2 of 2</Badge>
              <h2 className="text-lg font-semibold">{savedTitle}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Add photos to document the work — old part, replacement, and result.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1" onClick={() => setStep('details')}>
              <ChevronLeft className="size-4" />
              Back to details
            </Button>
            <Button className="gap-1" onClick={resetComposer}>
              <Check className="size-4" />
              Done — new entry
            </Button>
          </div>
        </div>

        <Separator />

        <PhotoDocumentation
          entryId={savedEntryId}
          images={images}
          editable
          onChanged={() => void loadImages(savedEntryId)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="secondary">Step 1 of 2</Badge>
        <h2 className="text-lg font-semibold">Log service or part replacement</h2>
        <p className="text-sm text-muted-foreground">
          Fill in all details, then attach photos of the old part, new part, and installation.
        </p>
      </div>

      <QuickAddTemplates onSelect={applyTemplate} />

      <EntryForm
        form={form}
        vehicles={vehicles}
        onChange={setForm}
        onSubmit={onSubmit}
        saving={saving}
        error={error}
        showVehicleSelect={activeVehicle == null}
      />
    </div>
  )
}
