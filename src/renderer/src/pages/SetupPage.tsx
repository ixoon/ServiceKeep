import { useState } from 'react'
import { FolderOpen, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import AppLogo from '@/components/AppLogo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getApi } from '@/lib/api'

interface Props {
  onConfigured: () => Promise<void>
}

export default function SetupPage({ onConfigured }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function chooseFolder() {
    setBusy(true)
    setError(null)
    try {
      const settings = await getApi().chooseDataPath()
      if (!settings.dataPath) {
        setError('No folder selected.')
        return
      }
      toast.success('Data folder ready')
      await onConfigured()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not set data folder.'
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
          <CardTitle className="text-2xl">Welcome to ServiceKeep</CardTitle>
          <CardDescription>
            Free, offline garage log for your vehicles. Choose where your data is stored — no account
            required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Track oil, services, parts, tires, and costs in EUR / km</span>
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Attach photos (receipts, parts) and set km/date reminders</span>
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Back up to USB anytime — your folder, your data</span>
            </li>
          </ul>

          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            Recommended folder: <span className="font-medium text-foreground">Documents/ServiceKeep</span>{' '}
            or a USB drive you can unplug safely after backup.
          </div>

          <Button className="w-full gap-2" disabled={busy} onClick={chooseFolder}>
            <FolderOpen className="size-4" />
            {busy ? 'Opening folder picker…' : 'Choose data folder'}
          </Button>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
