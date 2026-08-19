import type { ServiceKeepApi } from './index'

declare global {
  interface Window {
    servicekeep: ServiceKeepApi
  }
}

export {}
