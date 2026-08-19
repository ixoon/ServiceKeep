import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import { existsSync } from 'fs'
import { getAppIconPath } from './appMeta'
import { listReminders } from './entries'
import { readSettings } from './settings'
import { showReminderNotifications } from './notifications'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function buildTrayImage(): Electron.NativeImage {
  const iconPath = getAppIconPath()
  if (existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      return icon.resize({ width: 16, height: 16 })
    }
  }
  // Fallback: small red square
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const offset = i * 4
    canvas[offset] = 220
    canvas[offset + 1] = 38
    canvas[offset + 2] = 38
    canvas[offset + 3] = 255
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function overdueCount(): number {
  try {
    return listReminders().filter((item) => item.isOverdue).length
  } catch {
    return 0
  }
}

function updateTooltip(): void {
  if (!tray) return
  const overdue = overdueCount()
  const base = 'ServiceKeep'
  tray.setToolTip(overdue > 0 ? `${base} — ${overdue} overdue` : base)
}

function showMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function buildMenu(): Menu {
  const overdue = overdueCount()
  return Menu.buildFromTemplate([
    {
      label: overdue > 0 ? `Open (${overdue} overdue)` : 'Open ServiceKeep',
      click: () => {
        showMainWindow()
        mainWindow?.webContents.send('app:navigate', '/reminders')
      }
    },
    { type: 'separator' },
    {
      label: 'Export backup…',
      click: () => {
        showMainWindow()
        mainWindow?.webContents.send('app:navigate', '/settings')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy()
        tray = null
        app.quit()
      }
    }
  ])
}

export function initTray(window: BrowserWindow): void {
  if (tray) return

  mainWindow = window
  tray = new Tray(buildTrayImage())
  tray.setToolTip('ServiceKeep')
  updateTooltip()

  tray.on('click', () => showMainWindow())
  tray.on('right-click', () => {
    if (tray) tray.popUpContextMenu(buildMenu())
  })

  window.on('close', (event) => {
    if (process.platform === 'darwin') return
    event.preventDefault()
    window.hide()
  })
}

export function refreshTrayBadge(): void {
  updateTooltip()
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
  mainWindow = null
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
