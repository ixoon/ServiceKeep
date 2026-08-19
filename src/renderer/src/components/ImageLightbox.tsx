import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import type { ResolvedImage } from '@/hooks/useResolvedImages'
import { cn } from '@/lib/utils'

interface Props {
  images: ResolvedImage[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ImageLightbox({ images, initialIndex = 0, open, onOpenChange }: Props) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)))
    }
  }, [open, initialIndex, images.length])

  const current = images[index]

  function goPrev() {
    if (images.length < 2) return
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  function goNext() {
    if (images.length < 2) return
    setIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            goPrev()
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            goNext()
          }
        }}
      >
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        <DialogDescription className="sr-only">
          {current ? current.image.caption ?? current.image.fileName : 'Photo gallery'}
        </DialogDescription>

        <div className="relative flex min-h-[50vh] items-center justify-center bg-black/90">
          {current ? (
            <img
              src={current.src}
              alt={current.image.caption ?? current.image.fileName}
              className="max-h-[72vh] max-w-full object-contain"
            />
          ) : null}

          {images.length > 1 ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={goPrev}
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={goNext}
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          ) : null}
        </div>

        <div className="space-y-2 border-t px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="min-w-0 truncate">
              {current?.image.caption || current?.image.fileName || 'Photo'}
            </p>
            {images.length > 1 ? (
              <span className="shrink-0 tabular-nums">
                {index + 1} / {images.length} · ← →
              </span>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {images.map((item, thumbIndex) => (
                <button
                  key={item.image.id}
                  type="button"
                  className={cn(
                    'size-12 shrink-0 overflow-hidden rounded-md border',
                    thumbIndex === index ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                  )}
                  onClick={() => setIndex(thumbIndex)}
                >
                  <img
                    src={item.src}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
