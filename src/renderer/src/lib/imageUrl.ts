const IMAGE_PROTOCOL = 'app-image'

export function buildImageSrc(absolutePath: string): string {
  return `${IMAGE_PROTOCOL}://local/?path=${encodeURIComponent(absolutePath)}`
}
