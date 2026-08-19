import { net, protocol } from 'electron'
import { pathToFileURL } from 'url'
import fs from 'fs'

export const IMAGE_PROTOCOL = 'app-image'

export function registerImageScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: IMAGE_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true
      }
    }
  ])
}

export function registerImageProtocolHandler(): void {
  protocol.handle(IMAGE_PROTOCOL, async (request) => {
    try {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.searchParams.get('path') ?? '')

      if (!filePath || !fs.existsSync(filePath)) {
        return new Response('Image not found', { status: 404 })
      }

      return net.fetch(pathToFileURL(filePath).href)
    } catch (error) {
      console.error('Failed to serve image:', error)
      return new Response('Image error', { status: 500 })
    }
  })
}
