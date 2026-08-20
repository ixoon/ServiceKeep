import { useEffect, useState } from 'react'
import {
  Archive,
  Bell,
  Camera,
  Car,
  ExternalLink,
  Gauge,
  Pencil,
  Receipt,
  Trash2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Vehicle, VehicleCardSummary } from '../../../shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate, formatEur, formatKm } from '@/lib/format'
import { vehicleIdentityLine, vehicleSpecLine } from '@/lib/vehicleIdentity'
import { getApi } from '@/lib/api'

interface Props {
  vehicle: Vehicle
  summary: VehicleCardSummary | null
  isActive: boolean
  onEdit: () => void
  onSetActive: () => void
  onArchive: () => void
  onDelete: () => void
  onPhotoChanged: () => void
}

export default function VehicleCard({
  vehicle,
  summary,
  isActive,
  onEdit,
  onSetActive,
  onArchive,
  onDelete,
  onPhotoChanged
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!vehicle.photoPath) {
        setPhotoUrl(null)
        return
      }
      try {
        const url = await getApi().readVehiclePhotoAsDataUrl(vehicle.id)
        if (!cancelled) {
          setPhotoUrl(url)
        }
      } catch {
        if (!cancelled) {
          setPhotoUrl(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vehicle.id, vehicle.photoPath])

  async function handleAddPhoto() {
    setPhotoBusy(true)
    try {
      const updated = await getApi().addVehiclePhoto(vehicle.id)
      if (!updated) {
        return
      }
      toast.success('Photo added')
      await onPhotoChanged()
      const url = await getApi().readVehiclePhotoAsDataUrl(vehicle.id)
      setPhotoUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleRemovePhoto() {
    setPhotoBusy(true)
    try {
      await getApi().removeVehiclePhoto(vehicle.id)
      setPhotoUrl(null)
      toast.success('Photo removed')
      await onPhotoChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const subtitle = vehicleSpecLine(vehicle) || 'No details'
  const identity = vehicleIdentityLine(vehicle)

  return (
    <Card className={cn('overflow-hidden', isActive && 'ring-2 ring-primary/40')}>
      <div className="group relative aspect-[16/10] bg-muted/50">
        {photoUrl ? (
          <img src={photoUrl} alt={vehicle.name} className="size-full object-cover" />
        ) : (
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => void handleAddPhoto()}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera className="size-10 opacity-50" />
            <span className="text-sm font-medium">Add photo</span>
            <span className="text-xs">Click to choose an image</span>
          </button>
        )}

        {photoUrl ? (
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-background/90"
              disabled={photoBusy}
              onClick={() => void handleAddPhoto()}
            >
              <Camera className="size-3.5" />
              Change photo
            </Button>
          </div>
        ) : null}

        {photoUrl ? (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="icon"
              className="size-8 bg-background/80 backdrop-blur-sm"
              disabled={photoBusy}
              title="Remove photo"
              onClick={() => void handleRemovePhoto()}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}

        {isActive ? (
          <Badge className="absolute left-2 top-2" variant="default">
            Active
          </Badge>
        ) : null}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link to={`/vehicles/${vehicle.id}`} className="hover:underline">
            {vehicle.name}
          </Link>
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {identity ? <p className="text-xs text-muted-foreground">{identity}</p> : null}
      </CardHeader>

      <CardContent className="space-y-2 pb-4 text-sm">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 shrink-0 text-muted-foreground" />
          <span>{formatKm(vehicle.currentKm)}</span>
        </div>
        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {summary?.nextServiceTitle ? (
            <div>
              <div className="font-medium">{summary.nextServiceTitle}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(summary.nextServiceDueDate)} · {formatKm(summary.nextServiceDueKm)}
              </div>
              {summary.isNextOverdue ? (
                <Badge variant="destructive" className="mt-1">
                  Overdue
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  Due
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">No upcoming service</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Spent this year:{' '}
            <span className="font-medium">{formatEur(summary?.spentThisYear ?? 0)}</span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/20 px-6 py-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/vehicles/${vehicle.id}`}>Open</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        {!isActive ? (
          <Button variant="ghost" size="sm" onClick={onSetActive}>
            Set active
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onArchive}>
          <Archive className="size-4" />
          Archive
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
