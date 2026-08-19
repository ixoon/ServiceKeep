import { Camera, ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { EntryImage } from '../../../shared/types'
import ImageLightbox from '@/components/ImageLightbox'
import { useResolvedImages } from '@/hooks/useResolvedImages'
import { matchImageToSlot, PHOTO_SLOTS, type PhotoSlotId } from '@/lib/photoSlots'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'

interface Props {
  entryId: number
  images: EntryImage[]
  editable?: boolean
  onChanged?: () => void
}

export default function PhotoDocumentation({
  entryId,
  images,
  editable = false,
  onChanged
}: Props) {
  const { resolved, loading, error, reload } = useResolvedImages(images)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const slotMap = useMemo(() => {
    const map = new Map<PhotoSlotId, (typeof resolved)[number]>()
    const unmatched: typeof resolved = []

    for (const item of resolved) {
      const slot = PHOTO_SLOTS.find((s) => matchImageToSlot(item.image.caption, s.label))
      if (slot && !map.has(slot.id)) {
        map.set(slot.id, item)
      } else {
        unmatched.push(item)
      }
    }

    for (const item of unmatched) {
      const emptySlot = PHOTO_SLOTS.find((s) => !map.has(s.id))
      if (emptySlot) {
        map.set(emptySlot.id, item)
      }
    }

    return map
  }, [resolved])

  async function handleAdd(slotLabel: string) {
    try {
      await getApi().addImage(entryId, slotLabel)
      toast.success('Photo added')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add photo.')
    }
  }

  async function handleDelete(imageId: number) {
    try {
      await getApi().deleteImage(imageId)
      toast.success('Photo removed')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove photo.')
    }
  }

  function openLightbox(index: number) {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Photo documentation</p>
        <p className="text-xs text-muted-foreground">
          Document the old part, replacement, and finished work — up to 5 photos.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading photos…
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="gap-1" onClick={reload}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {resolved.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            All photos — click to enlarge
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {resolved.map((item, index) => (
              <button
                key={item.image.id}
                type="button"
                className="group relative size-24 shrink-0 overflow-hidden rounded-lg border"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={item.src}
                  alt={item.image.caption ?? item.image.fileName}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PHOTO_SLOTS.map((slot) => {
            const item = slotMap.get(slot.id)

            return (
              <div
                key={slot.id}
                className="flex flex-col overflow-hidden rounded-lg border bg-muted/20"
              >
                <div className="border-b px-3 py-2">
                  <p className="text-xs font-medium">{slot.label}</p>
                  <p className="text-[11px] text-muted-foreground">{slot.hint}</p>
                </div>

                {item ? (
                  <div className="group relative aspect-[4/3]">
                    <button
                      type="button"
                      className="size-full"
                      onClick={() => {
                        const index = resolved.findIndex((r) => r.image.id === item.image.id)
                        openLightbox(index >= 0 ? index : 0)
                      }}
                    >
                      <img
                        src={item.src}
                        alt={slot.label}
                        className="size-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </button>
                    {editable ? (
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => void handleDelete(item.image.id)}
                        title="Remove photo"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                ) : editable ? (
                  <button
                    type="button"
                    disabled={images.length >= 5}
                    className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-4 text-muted-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void handleAdd(slot.label)}
                  >
                    <ImagePlus className="size-6" />
                    <span className="text-xs">Add photo</span>
                  </button>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground/50">
                    <Camera className="size-8" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {editable && images.length >= 5 ? (
        <p className="text-xs text-muted-foreground">
          Maximum 5 photos reached. Remove one to add another.
        </p>
      ) : null}

      <ImageLightbox
        images={resolved}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
