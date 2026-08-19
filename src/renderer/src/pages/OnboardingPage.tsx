import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Car, CheckCircle2, Gauge, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApi } from '@/lib/api'
import { ENTRY_TEMPLATES } from '@/lib/entryTemplates'

interface Props {
  onComplete: () => Promise<void>
}

const STEPS = ['Vehicle', 'Odometer', 'First service'] as const

export default function OnboardingPage({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [currentKm, setCurrentKm] = useState('')

  const [logOil, setLogOil] = useState(true)
  const [oilDate, setOilDate] = useState(new Date().toISOString().slice(0, 10))
  const [oilCost, setOilCost] = useState('')

  async function finish(event?: FormEvent) {
    event?.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Vehicle name is required.')
      setStep(0)
      return
    }

    setBusy(true)
    try {
      const api = getApi()
      const vehicle = await api.createVehicle({
        name: name.trim(),
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? Number(year) : null,
        vin: vin.trim() || null,
        licensePlate: licensePlate.trim() || null,
        currentKm: currentKm ? Number(currentKm) : 0
      })

      await api.setActiveVehicle(vehicle.id)

      if (logOil) {
        const oilTemplate = ENTRY_TEMPLATES.find((item) => item.id === 'oil')
        const km = currentKm ? Number(currentKm) : vehicle.currentKm
        const nextDueDate =
          oilTemplate?.nextDueDays != null
            ? (() => {
                const date = new Date(oilDate)
                date.setDate(date.getDate() + oilTemplate.nextDueDays!)
                return date.toISOString().slice(0, 10)
              })()
            : null
        await api.createEntry({
          vehicleId: vehicle.id,
          category: 'oil',
          title: oilTemplate?.title ?? 'Oil + filter change',
          performedAt: oilDate,
          odometerKm: km,
          costEur: oilCost ? Number(oilCost) : null,
          nextDueDate,
          nextDueKm:
            oilTemplate?.nextDueKmOffset != null ? km + oilTemplate.nextDueKmOffset : null
        })
      }

      await api.setOnboardingComplete(true)
      toast.success('Your garage is ready')
      await onComplete()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not finish setup.'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <AppLogo className="mb-2" />
          <CardTitle className="text-2xl">Set up your first vehicle</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </CardDescription>
          <div className="flex gap-2 pt-2">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {step === 0 ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!name.trim()) {
                  setError('Vehicle name is required.')
                  return
                }
                setError(null)
                setStep(1)
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Car className="size-4 text-primary" />
                  What are you tracking?
                </div>
                Give it a friendly name — e.g. &quot;Daily Golf&quot; or &quot;Work van&quot;.
              </div>

              <div className="space-y-2">
                <Label htmlFor="onb-name">Name / label</Label>
                <Input
                  id="onb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Daily driver"
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onb-make">Make</Label>
                  <Input
                    id="onb-make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Volkswagen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-model">Model</Label>
                  <Input
                    id="onb-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Golf"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-year">Year (optional)</Label>
                <Input
                  id="onb-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onb-vin">VIN / chassis (optional)</Label>
                  <Input
                    id="onb-vin"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="WVWZZZ1JZXW000000"
                    autoCapitalize="characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-plate">License plate (optional)</Label>
                  <Input
                    id="onb-plate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="BG-123-AB"
                    autoCapitalize="characters"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          ) : null}

          {step === 1 ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                setError(null)
                setStep(2)
              }}
            >
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Gauge className="size-4 text-primary" />
                  Current odometer
                </div>
                This helps calculate km-based reminders for oil and service.
              </div>

              <div className="space-y-2">
                <Label htmlFor="onb-km">Current km</Label>
                <Input
                  id="onb-km"
                  type="number"
                  min="0"
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                  placeholder="125000"
                  autoFocus
                />
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" className="gap-2" onClick={() => setStep(0)}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button type="submit" className="gap-2">
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="space-y-4" onSubmit={(event) => void finish(event)}>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Wrench className="size-4 text-primary" />
                  Last oil change (optional)
                </div>
                Log your most recent oil change to see a next-due reminder right away.
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={logOil}
                  onChange={(e) => setLogOil(e.target.checked)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm">Log last oil change</span>
              </label>

              {logOil ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="onb-oil-date">Performed on</Label>
                    <Input
                      id="onb-oil-date"
                      type="date"
                      value={oilDate}
                      onChange={(e) => setOilDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onb-oil-cost">Cost (EUR, optional)</Label>
                    <Input
                      id="onb-oil-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={oilCost}
                      onChange={(e) => setOilCost(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex justify-between">
                <Button type="button" variant="outline" className="gap-2" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button type="submit" disabled={busy} className="gap-2">
                  <CheckCircle2 className="size-4" />
                  {busy ? 'Finishing…' : 'Finish setup'}
                </Button>
              </div>
            </form>
          ) : null}

          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
