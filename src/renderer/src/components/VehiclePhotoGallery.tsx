import { useMemo, useState } from 'react'
import { Images, Loader2 } from 'lucide-react'
import type { VehicleGalleryImage } from '../../../shared/types'
import ImageLightbox from '@/components/ImageLightbox'
import { useResolvedImages } from '@/hooks/useResolvedImages'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'

interface Props {
  images: VehicleGalleryImage[]
  loading?: boolean
  onSelectEntry?: (entryId: number) => void
}

export default function VehiclePhotoGallery({ images, loading = false, onSelectEntry }: Props) {
  const { resolved, loading: resolving } = useResolvedImages(images)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const labeled = useMemo(
    () =>
      resolved.map((item) => {
        const meta = images.find((image) => image.id === item.image.id)
        const caption = [meta?.entryTitle, item.image.caption, meta ? formatDate(meta.performedAt) : null]
          .filter(Boolean)
          .join(' · ')
        return {
          ...item,
          image: { ...item.image, caption }
        }
      }),
    [resolved, images]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Images className="size-4" />
          Photo gallery
        </CardTitle>
        <CardDescription>Receipts, parts, and work photos from this vehicle’s entries.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || resolving ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading photos…
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No photos yet. Add them on a service entry after you log the work.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {labeled.map((item, index) => {
              const meta = images.find((image) => image.id === item.image.id)
              return (
                <button
                  key={item.image.id}
                  type="button"
                  className="group overflow-hidden rounded-lg border text-left"
                  onClick={() => {
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }}
                  onDoubleClick={() => {
                    if (meta && onSelectEntry) onSelectEntry(meta.entryId)
                  }}
                  title={item.image.caption ?? meta?.entryTitle}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.src}
                      alt={item.image.caption ?? item.image.fileName}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                    {meta?.entryTitle ?? 'Photo'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>

      <ImageLightbox
        images={labeled}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </Card>
  )
}
