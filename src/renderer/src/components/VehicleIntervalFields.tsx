import type { IntervalOverrideMap, Vehicle } from '../../../shared/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INTERVAL_TEMPLATES } from '@/lib/entryTemplates'

interface Props {
  vehicle?: Vehicle | null
  value: IntervalOverrideMap
  onChange: (next: IntervalOverrideMap) => void
}

function numberOrEmpty(value: number | null | undefined): string {
  return value == null ? '' : String(value)
}

export default function VehicleIntervalFields({ vehicle, value, onChange }: Props) {
  function updateField(templateId: string, field: 'nextDueKmOffset' | 'nextDueDays', raw: string) {
    const parsed = raw.trim() === '' ? null : Number(raw)
    const nextValue = parsed != null && Number.isFinite(parsed) ? parsed : null
    const current = value[templateId] ?? {}
    const next: IntervalOverrideMap = {
      ...value,
      [templateId]: {
        ...current,
        [field]: nextValue
      }
    }

    const row = next[templateId]
    if (row && row.nextDueKmOffset == null && row.nextDueDays == null) {
      const rest = { ...next }
      delete rest[templateId]
      onChange(rest)
      return
    }

    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Service intervals</p>
        <p className="text-xs text-muted-foreground">
          Leave blank to use the default (oil 10,000 km / 365 days). Override per vehicle — e.g. diesel at
          15,000 km.
        </p>
      </div>

      <div className="space-y-3">
        {INTERVAL_TEMPLATES.map((template) => {
          const override = value[template.id]
          const effectiveKm = override?.nextDueKmOffset ?? template.nextDueKmOffset
          const effectiveDays = override?.nextDueDays ?? template.nextDueDays
          const nextKm =
            vehicle && effectiveKm != null ? vehicle.currentKm + effectiveKm : null

          return (
            <div key={template.id} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">{template.label}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`interval-km-${template.id}`}>Interval km</Label>
                  <Input
                    id={`interval-km-${template.id}`}
                    type="number"
                    min="0"
                    placeholder={template.nextDueKmOffset?.toString() ?? '—'}
                    value={numberOrEmpty(override?.nextDueKmOffset)}
                    onChange={(e) =>
                      updateField(template.id, 'nextDueKmOffset', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`interval-days-${template.id}`}>Interval days</Label>
                  <Input
                    id={`interval-days-${template.id}`}
                    type="number"
                    min="0"
                    placeholder={template.nextDueDays?.toString() ?? '—'}
                    value={numberOrEmpty(override?.nextDueDays)}
                    onChange={(e) => updateField(template.id, 'nextDueDays', e.target.value)}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Next due from current km:{' '}
                {nextKm != null ? `${nextKm.toLocaleString('en-GB')} km` : '—'}
                {effectiveDays != null ? ` · ${effectiveDays} days` : ''}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
