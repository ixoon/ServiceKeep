type ServiceKeepApi = Window['servicekeep']

export function getApi(): ServiceKeepApi {
  if (typeof window === 'undefined' || !window.servicekeep) {
    throw new Error('ServiceKeep must run inside the desktop app (Electron).')
  }
  return window.servicekeep
}

export function hasApi(): boolean {
  return typeof window !== 'undefined' && Boolean(window.servicekeep)
}
