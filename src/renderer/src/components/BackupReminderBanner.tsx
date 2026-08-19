import { useMemo, useState } from 'react'
import { HardDrive, X } from 'lucide-react'
import { toast } from 'sonner'
import type { AppSettings } from '../../../shared/types'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'

const BACKUP_REMINDER_DAYS = 45

interface Props {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export default function BackupReminderBanner({ settings, onSettingsChange }: Props) {
  const [dismissedSession, setDismissedSession] = useState(false)

  const shouldShow = useMemo(() => {
    if (dismissedSession || !settings.dataPath) return false

    if (!settings.lastBackupAt) return true

    const last = new Date(settings.lastBackupAt).getTime()
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)
    return daysSince >= BACKUP_REMINDER_DAYS
  }, [settings.dataPath, settings.lastBackupAt, dismissedSession])

  if (!shouldShow) return null

  const message = settings.lastBackupAt
    ? 'Your last backup was more than 45 days ago. Export a copy to USB or another folder.'
    : 'You have not exported a backup yet. Protect your garage data with a local backup.'

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <HardDrive className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium">Backup recommended</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            try {
              const dest = await getApi().exportBackup()
              if (dest) {
                const updated = await getApi().getSettings()
                onSettingsChange(updated)
                toast.success('Backup created', { description: dest })
                setDismissedSession(true)
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Backup failed.')
            }
          }}
        >
          <HardDrive className="size-4" />
          Export backup
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            const updated = await getApi().dismissBackupReminder()
            onSettingsChange(updated)
            setDismissedSession(true)
          }}
        >
          <X className="size-4" />
          Dismiss
        </Button>
      </div>
    </div>
  )
}
