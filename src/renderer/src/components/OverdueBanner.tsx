import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface Props {
  overdueCount: number
  dueCount: number
}

export default function OverdueBanner({ overdueCount, dueCount }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || overdueCount === 0) {
    return null
  }

  const label =
    overdueCount === 1
      ? '1 item overdue'
      : `${overdueCount} items overdue`

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{label}</p>
          <p className="text-sm text-muted-foreground">
            {dueCount > overdueCount
              ? `${dueCount - overdueCount} more due soon.`
              : 'Review reminders and schedule service.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/reminders">View reminders</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
