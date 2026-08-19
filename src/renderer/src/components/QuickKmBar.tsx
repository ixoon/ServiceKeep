import { useState } from 'react'
import { Gauge } from 'lucide-react'
import type { Vehicle } from '../../../shared/types'
import UpdateKmDialog from '@/components/UpdateKmDialog'
import { Button } from '@/components/ui/button'
import { formatKm } from '@/lib/format'

interface Props {
  vehicle: Vehicle | null
  onUpdated: () => Promise<void>
}

export default function QuickKmBar({ vehicle, onUpdated }: Props) {
  const [open, setOpen] = useState(false)

  if (!vehicle) {
    return null
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <Gauge className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Current km:</span>
        <span className="font-medium">{formatKm(vehicle.currentKm)}</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto px-1 py-0"
          onClick={() => setOpen(true)}
        >
          Update
        </Button>
        <span className="text-xs text-muted-foreground">· {vehicle.name}</span>
      </div>

      <UpdateKmDialog
        vehicle={vehicle}
        open={open}
        onOpenChange={setOpen}
        onUpdated={onUpdated}
      />
    </>
  )
}
