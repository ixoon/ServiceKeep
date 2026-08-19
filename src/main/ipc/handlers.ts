import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from 'electron'
import { getCurrentDataPath, initDb } from '../db'
import { backupToFolder, restoreFromFolder } from '../services/backup'
import {
  archiveEntry,
  createEntry,
  deleteEntryPermanently,
  getEntry,
  listEntries,
  listReminders,
  restoreEntry,
  searchGarage,
  updateEntry
} from '../services/entries'
import {
  addImageFromPath,
  deleteImage,
  listImages,
  listVehicleImages,
  readImageAsDataUrl,
  resolveImageAbsolutePath,
  updateImageCaption
} from '../services/images'
import { getAppMeta } from '../services/appMeta'
import { readSettings, setTheme, writeSettings } from '../services/settings'
import { clearReminder, snoozeReminder } from '../services/reminderActions'
import {
  exportEntriesCsv,
  exportRemindersCsv,
  exportVehicleHistoryPdf
} from '../services/export'
import { refreshTrayBadge } from '../services/tray'
import { nowIso } from '../db'
import {
  getAvailableYears,
  getSpendByCategory,
  getSpendByMonth,
  getSpendByVehicle,
  getTotalSpend,
  getVehicleCardSummaries
} from '../services/reports'
import {
  readVehiclePhotoAsDataUrl,
  removeVehiclePhoto,
  setVehiclePhotoFromPath
} from '../services/vehiclePhotos'
import {
  archiveVehicle,
  createVehicle,
  deleteVehiclePermanently,
  getVehicle,
  listVehicles,
  restoreVehicle,
  updateVehicle
} from '../services/vehicles'
import type { ServiceEntryInput, ThemeMode, VehicleInput } from '../../shared/types'

function requireDataPath(): string {
  const dataPath = getCurrentDataPath() ?? readSettings().dataPath
  if (!dataPath) {
    throw new Error('Data folder is not configured.')
  }
  if (!getCurrentDataPath()) {
    initDb(dataPath)
  }
  return dataPath
}

async function openDialog(options: OpenDialogOptions) {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (win) {
    return dialog.showOpenDialog(win, options)
  }
  return dialog.showOpenDialog(options)
}

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getMeta', () => getAppMeta())

  ipcMain.handle('settings:get', () => readSettings())

  ipcMain.handle('settings:setTheme', (_e, theme: ThemeMode) => setTheme(theme))

  ipcMain.handle('settings:setActiveVehicle', (_e, vehicleId: number | null) =>
    writeSettings({ activeVehicleId: vehicleId })
  )

  ipcMain.handle('settings:setNotificationsEnabled', (_e, enabled: boolean) =>
    writeSettings({ notificationsEnabled: enabled })
  )

  ipcMain.handle('settings:setOnboardingComplete', (_e, complete: boolean) =>
    writeSettings({ onboardingComplete: complete })
  )

  ipcMain.handle('settings:dismissBackupReminder', () =>
    writeSettings({ backupReminderDismissedAt: nowIso() })
  )

  ipcMain.handle('app:chooseDataPath', async () => {
    const result = await openDialog({
      title: 'Choose ServiceKeep data folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return readSettings()
    }
    const dataPath = result.filePaths[0]
    initDb(dataPath)
    return writeSettings({ dataPath })
  })

  ipcMain.handle('app:initIfConfigured', () => {
    const settings = readSettings()
    if (settings.dataPath) {
      initDb(settings.dataPath)
      return { ready: true, settings }
    }
    return { ready: false, settings }
  })

  ipcMain.handle('vehicles:list', (_e, includeArchived?: boolean) => {
    requireDataPath()
    return listVehicles(Boolean(includeArchived))
  })

  ipcMain.handle('vehicles:get', (_e, id: number) => {
    requireDataPath()
    return getVehicle(id)
  })

  ipcMain.handle('vehicles:create', (_e, input: VehicleInput) => {
    requireDataPath()
    return createVehicle(input)
  })

  ipcMain.handle('vehicles:update', (_e, id: number, input: Partial<VehicleInput>) => {
    requireDataPath()
    return updateVehicle(id, input)
  })

  ipcMain.handle('vehicles:archive', (_e, id: number) => {
    requireDataPath()
    return archiveVehicle(id)
  })

  ipcMain.handle('vehicles:restore', (_e, id: number) => {
    requireDataPath()
    return restoreVehicle(id)
  })

  ipcMain.handle('vehicles:deletePermanent', (_e, id: number) => {
    requireDataPath()
    deleteVehiclePermanently(id)
    return true
  })

  ipcMain.handle('vehicles:addPhoto', async (_e, vehicleId: number) => {
    requireDataPath()
    const result = await openDialog({
      title: 'Choose vehicle photo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    setVehiclePhotoFromPath(vehicleId, result.filePaths[0])
    return getVehicle(vehicleId)
  })

  ipcMain.handle('vehicles:removePhoto', (_e, vehicleId: number) => {
    requireDataPath()
    removeVehiclePhoto(vehicleId)
    return true
  })

  ipcMain.handle('vehicles:readPhotoAsDataUrl', (_e, vehicleId: number) => {
    requireDataPath()
    return readVehiclePhotoAsDataUrl(vehicleId)
  })

  ipcMain.handle('entries:list', (_e, vehicleId?: number, includeArchived?: boolean) => {
    requireDataPath()
    return listEntries(vehicleId, Boolean(includeArchived))
  })

  ipcMain.handle('entries:get', (_e, id: number) => {
    requireDataPath()
    return getEntry(id)
  })

  ipcMain.handle('entries:create', (_e, input: ServiceEntryInput) => {
    requireDataPath()
    return createEntry(input)
  })

  ipcMain.handle('entries:update', (_e, id: number, input: Partial<ServiceEntryInput>) => {
    requireDataPath()
    return updateEntry(id, input)
  })

  ipcMain.handle('entries:archive', (_e, id: number) => {
    requireDataPath()
    return archiveEntry(id)
  })

  ipcMain.handle('entries:restore', (_e, id: number) => {
    requireDataPath()
    return restoreEntry(id)
  })

  ipcMain.handle('entries:deletePermanent', (_e, id: number) => {
    requireDataPath()
    deleteEntryPermanently(id)
    return true
  })

  ipcMain.handle('entries:search', (_e, query: string) => {
    requireDataPath()
    return searchGarage(query)
  })

  ipcMain.handle('reminders:list', () => {
    requireDataPath()
    const items = listReminders()
    refreshTrayBadge()
    return items
  })

  ipcMain.handle('reminders:clear', (_e, entryId: number) => {
    requireDataPath()
    const entry = clearReminder(entryId)
    refreshTrayBadge()
    return entry
  })

  ipcMain.handle(
    'reminders:snooze',
    (_e, entryId: number, options: { days?: number; km?: number }) => {
      requireDataPath()
      const entry = snoozeReminder(entryId, options)
      refreshTrayBadge()
      return entry
    }
  )

  ipcMain.handle('export:entriesCsv', (_e, vehicleId?: number | null) => {
    requireDataPath()
    return exportEntriesCsv(vehicleId)
  })

  ipcMain.handle('export:remindersCsv', () => {
    requireDataPath()
    return exportRemindersCsv()
  })

  ipcMain.handle('export:vehiclePdf', (_e, vehicleId: number, year?: number) => {
    requireDataPath()
    return exportVehicleHistoryPdf(vehicleId, year)
  })

  ipcMain.handle('reports:getAvailableYears', () => {
    requireDataPath()
    return getAvailableYears()
  })

  ipcMain.handle('reports:getTotalSpend', (_e, year: number, vehicleId?: number | null) => {
    requireDataPath()
    return getTotalSpend(year, vehicleId)
  })

  ipcMain.handle('reports:getSpendByVehicle', (_e, year: number) => {
    requireDataPath()
    return getSpendByVehicle(year)
  })

  ipcMain.handle('reports:getSpendByCategory', (_e, year: number, vehicleId?: number | null) => {
    requireDataPath()
    return getSpendByCategory(year, vehicleId)
  })

  ipcMain.handle('reports:getSpendByMonth', (_e, year: number, vehicleId?: number | null) => {
    requireDataPath()
    return getSpendByMonth(year, vehicleId)
  })

  ipcMain.handle('reports:getVehicleCardSummaries', (_e, year: number) => {
    requireDataPath()
    return getVehicleCardSummaries(year)
  })

  ipcMain.handle('images:list', (_e, entryId: number) => {
    requireDataPath()
    return listImages(entryId)
  })

  ipcMain.handle('images:listForVehicle', (_e, vehicleId: number) => {
    requireDataPath()
    return listVehicleImages(vehicleId)
  })

  ipcMain.handle('images:add', async (_e, entryId: number, caption?: string | null) => {
    requireDataPath()
    const result = await openDialog({
      title: 'Add image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return addImageFromPath(entryId, result.filePaths[0], caption ?? null)
  })

  ipcMain.handle('images:delete', (_e, id: number) => {
    requireDataPath()
    deleteImage(id)
    return true
  })

  ipcMain.handle('images:resolvePath', (_e, relativePath: string) => {
    requireDataPath()
    return resolveImageAbsolutePath(relativePath)
  })

  ipcMain.handle('images:readAsDataUrl', (_e, relativePath: string) => {
    requireDataPath()
    return readImageAsDataUrl(relativePath)
  })

  ipcMain.handle('images:updateCaption', (_e, id: number, caption: string | null) => {
    requireDataPath()
    return updateImageCaption(id, caption)
  })

  ipcMain.handle('backup:export', async () => {
    requireDataPath()
    const result = await openDialog({
      title: 'Choose backup destination (e.g. USB drive)',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    const dest = backupToFolder(result.filePaths[0])
    writeSettings({ lastBackupAt: nowIso(), backupReminderDismissedAt: null })
    return dest
  })

  ipcMain.handle('backup:restore', async () => {
    const settings = readSettings()
    if (!settings.dataPath) {
      throw new Error('Choose a data folder before restoring.')
    }

    const result = await openDialog({
      title: 'Choose backup folder (contains data.db)',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    restoreFromFolder(result.filePaths[0], settings.dataPath)
    return readSettings()
  })
}
