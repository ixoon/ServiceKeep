import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { EntryImage } from '../../../shared/types'
import { useResolvedImages } from '@/hooks/useResolvedImages'
import ImageLightbox from '@/components/ImageLightbox'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'

interface Props {
  entryId: number
  images: EntryImage[]
  editable?: boolean
  onChanged?: () => void
}

export default function EntryImageGallery({
  entryId,
  images,
  editable = false,
  onChanged
}: Props) {
  const { resolved, loading } = useResolvedImages(images)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  async function handleAdd() {
    try {
      await getApi().addImage(entryId)
      toast.success('Image added')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add image.')
    }
  }

  async function handleDelete(imageId: number) {
    try {
      await getApi().deleteImage(imageId)
      toast.success('Image removed')
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove image.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Photos ({images.length}/5)</p>
        {editable ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={images.length >= 5}
            onClick={() => void handleAdd()}
          >
            <ImagePlus className="size-4" />
            Add
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading photos…
        </div>
      ) : resolved.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos attached.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {resolved.map((item, index) => (
            <div key={item.image.id} className="group relative aspect-square overflow-hidden rounded-lg border">
              <button
                type="button"
                className="size-full"
                onClick={() => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
              >
                <img
                  src={item.src}
                  alt={item.image.fileName}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
              {editable ? (
                <Button
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => void handleDelete(item.image.id)}
                  title="Remove photo"
                >
                  <Trash2 className="size-3" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <ImageLightbox
        images={resolved}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
