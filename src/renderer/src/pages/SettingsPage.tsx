import { useEffect, useState } from 'react'
import { Bell, Keyboard, MonitorSmartphone } from 'lucide-react'
import { toast } from 'sonner'
import type { AppSettings } from '../../../shared/types'
import AppLogo from '@/components/AppLogo'
import PageHeader from '../components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getApi } from '@/lib/api'

interface Props {
  settings: AppSettings
  onChange: () => Promise<void>
  onSettingsChange: (settings: AppSettings) => void
}

export default function SettingsPage({ settings, onChange, onSettingsChange }: Props) {
  const [busy, setBusy] = useState<'backup' | 'restore' | 'folder' | null>(null)
  const [appVersion, setAppVersion] = useState('…')
  const [isPackaged, setIsPackaged] = useState(false)

  useEffect(() => {
    void getApi()
      .getAppMeta()
      .then((meta) => {
        setAppVersion(meta.version)
        setIsPackaged(meta.isPackaged)
      })
      .catch(() => setAppVersion('1.0.0'))
  }, [])

  return (
    <div>
      <PageHeader title="Settings" description="Data location, backup, and app preferences." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MonitorSmartphone className="size-4 text-primary" />
              Data folder
            </CardTitle>
            <CardDescription>
              Your SQLite database and images are stored here. Choose a location you can back up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs break-all">
              {settings.dataPath}
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={busy === 'folder'}
              onClick={async () => {
                setBusy('folder')
                try {
                  await getApi().chooseDataPath()
                  await onChange()
                  toast.success('Data folder updated')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Could not change folder.')
                } finally {
                  setBusy(null)
                }
              }}
            >
              {busy === 'folder' ? 'Opening…' : 'Change data folder'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Local OS notification when due or overdue reminders are detected at app start.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={settings.notificationsEnabled ? 'default' : 'outline'}
              onClick={async () => {
                const updated = await getApi().setNotificationsEnabled(!settings.notificationsEnabled)
                onSettingsChange(updated)
                toast.success(
                  updated.notificationsEnabled
                    ? 'Startup notifications enabled'
                    : 'Startup notifications disabled'
                )
              }}
            >
              {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup & restore</CardTitle>
            <CardDescription>
              Export creates a folder with <code className="text-xs">data.db</code> and{' '}
              <code className="text-xs">images/</code> — ideal for USB or another disk.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              disabled={busy === 'backup'}
              onClick={async () => {
                setBusy('backup')
                try {
                  const dest = await getApi().exportBackup()
                  if (dest) {
                    toast.success('Backup created', { description: dest })
                  }
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Backup failed.')
                } finally {
                  setBusy(null)
                }
              }}
            >
              {busy === 'backup' ? 'Exporting…' : 'Export backup'}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={busy === 'restore'}
              onClick={async () => {
                setBusy('restore')
                try {
                  const result = await getApi().restoreBackup()
                  if (result) {
                    await onChange()
                    toast.success('Backup restored successfully')
                  }
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Restore failed.')
                } finally {
                  setBusy(null)
                }
              }}
            >
              {busy === 'restore' ? 'Restoring…' : 'Restore backup'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Keyboard className="size-4 text-primary" />
              Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 rounded-lg border px-3 py-2">
                <dt className="text-muted-foreground">Search garage</dt>
                <dd>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl K</kbd>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About ServiceKeep</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <AppLogo size="lg" />
              <div>
                <p className="font-semibold">ServiceKeep</p>
                <p className="text-sm text-muted-foreground">
                  Version {appVersion}
                  {isPackaged ? '' : ' (development)'}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Local garage log for multiple vehicles — service history, costs, photos, and
                reminders. Offline-first, no cloud account.
              </p>
              <p>
                Theme: <span className="font-medium text-foreground">{settings.theme}</span> — toggle
                from the sidebar.
              </p>
              <p>Currency: EUR · Units: km · Notifications: {settings.notificationsEnabled ? 'on' : 'off'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
