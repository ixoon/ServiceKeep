import { join } from 'path'
import { app } from 'electron'
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '../../shared/appMeta'

export function getAppVersion(): string {
  return APP_VERSION
}

export function getAppMeta() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    tagline: APP_TAGLINE,
    platform: process.platform,
    isPackaged: app.isPackaged
  }
}

export function getAppIconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icon.png')
  }
  return join(__dirname, '../../build/icon.png')
}
