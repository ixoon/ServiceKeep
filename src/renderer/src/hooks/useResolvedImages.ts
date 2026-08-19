import { useCallback, useEffect, useState } from 'react'
import type { EntryImage } from '../../../shared/types'
import { getApi } from '@/lib/api'
import { buildImageSrc } from '@/lib/imageUrl'

export interface ResolvedImage {
  image: EntryImage
  src: string
}

async function resolveOneImage(image: EntryImage): Promise<ResolvedImage> {
  const api = getApi()
  const absolutePath = await api.resolveImagePath(image.relativePath)

  if (typeof api.readImageAsDataUrl === 'function') {
    try {
      const dataUrl = await api.readImageAsDataUrl(image.relativePath)
      return { image, src: dataUrl }
    } catch {
      // Fall through to protocol URL
    }
  }

  return { image, src: buildImageSrc(absolutePath) }
}

export function useResolvedImages(images: EntryImage[]) {
  const [resolved, setResolved] = useState<ResolvedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (imageList: EntryImage[]) => {
    if (imageList.length === 0) {
      setResolved([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(imageList.map(resolveOneImage))
      setResolved(results)
    } catch (err) {
      setResolved([])
      setError(err instanceof Error ? err.message : 'Could not load photos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(images)
  }, [images.map((image) => image.id).join(','), load])

  return { resolved, loading, error, reload: () => void load(images) }
}
