import { app, BrowserWindow, nativeImage, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { registerImageProtocolHandler, registerImageScheme } from './imageProtocol'
import { registerIpcHandlers } from './ipc/handlers'
import { initDb } from './db'
import { getAppIconPath } from './services/appMeta'
import { readSettings } from './services/settings'
import {
  showStartupReminderNotifications,
  startPeriodicReminderNotifications
} from './services/notifications'
import { initTray } from './services/tray'

registerImageScheme()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const iconPath = getAppIconPath()
  const icon = existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'ServiceKeep',
    icon,
    backgroundColor: '#0b0b0c',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  initTray(mainWindow)
}

app.whenReady().then(() => {
  registerImageProtocolHandler()
  registerIpcHandlers()

  const settings = readSettings()
  if (settings.dataPath) {
    try {
      initDb(settings.dataPath)
      showStartupReminderNotifications()
      startPeriodicReminderNotifications()
    } catch (error) {
      console.error('Failed to open data folder:', error)
    }
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  // Tray keeps the app running on Windows/Linux when the window is hidden.
})
