import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  EntryImage,
  ReminderItem,
  SearchHit,
  ServiceEntry,
  ServiceEntryInput,
  SpendByCategoryRow,
  SpendByMonthRow,
  SpendByVehicleRow,
  ThemeMode,
  Vehicle,
  VehicleCardSummary,
  VehicleGalleryImage,
  VehicleInput
} from '../shared/types'

const api = {
  getAppMeta: (): Promise<{
    name: string
    version: string
    tagline: string
    platform: string
    isPackaged: boolean
  }> => ipcRenderer.invoke('app:getMeta'),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setTheme: (theme: ThemeMode): Promise<AppSettings> => ipcRenderer.invoke('settings:setTheme', theme),
  setActiveVehicle: (vehicleId: number | null): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:setActiveVehicle', vehicleId),
  setNotificationsEnabled: (enabled: boolean): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:setNotificationsEnabled', enabled),
  setOnboardingComplete: (complete: boolean): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:setOnboardingComplete', complete),
  chooseDataPath: (): Promise<AppSettings> => ipcRenderer.invoke('app:chooseDataPath'),
  initIfConfigured: (): Promise<{ ready: boolean; settings: AppSettings }> =>
    ipcRenderer.invoke('app:initIfConfigured'),

  listVehicles: (includeArchived?: boolean): Promise<Vehicle[]> =>
    ipcRenderer.invoke('vehicles:list', includeArchived),
  getVehicle: (id: number): Promise<Vehicle | null> => ipcRenderer.invoke('vehicles:get', id),
  createVehicle: (input: VehicleInput): Promise<Vehicle> =>
    ipcRenderer.invoke('vehicles:create', input),
  updateVehicle: (id: number, input: Partial<VehicleInput>): Promise<Vehicle> =>
    ipcRenderer.invoke('vehicles:update', id, input),
  archiveVehicle: (id: number): Promise<Vehicle> => ipcRenderer.invoke('vehicles:archive', id),
  restoreVehicle: (id: number): Promise<Vehicle> => ipcRenderer.invoke('vehicles:restore', id),
  deleteVehiclePermanent: (id: number): Promise<boolean> =>
    ipcRenderer.invoke('vehicles:deletePermanent', id),
  addVehiclePhoto: (vehicleId: number): Promise<Vehicle | null> =>
    ipcRenderer.invoke('vehicles:addPhoto', vehicleId),
  removeVehiclePhoto: (vehicleId: number): Promise<boolean> =>
    ipcRenderer.invoke('vehicles:removePhoto', vehicleId),
  readVehiclePhotoAsDataUrl: (vehicleId: number): Promise<string | null> =>
    ipcRenderer.invoke('vehicles:readPhotoAsDataUrl', vehicleId),

  listEntries: (vehicleId?: number, includeArchived?: boolean): Promise<ServiceEntry[]> =>
    ipcRenderer.invoke('entries:list', vehicleId, includeArchived),
  getEntry: (id: number): Promise<ServiceEntry | null> => ipcRenderer.invoke('entries:get', id),
  createEntry: (input: ServiceEntryInput): Promise<ServiceEntry> =>
    ipcRenderer.invoke('entries:create', input),
  updateEntry: (id: number, input: Partial<ServiceEntryInput>): Promise<ServiceEntry> =>
    ipcRenderer.invoke('entries:update', id, input),
  archiveEntry: (id: number): Promise<ServiceEntry> => ipcRenderer.invoke('entries:archive', id),
  restoreEntry: (id: number): Promise<ServiceEntry> => ipcRenderer.invoke('entries:restore', id),
  deleteEntryPermanent: (id: number): Promise<boolean> =>
    ipcRenderer.invoke('entries:deletePermanent', id),
  searchGarage: (query: string): Promise<SearchHit[]> =>
    ipcRenderer.invoke('entries:search', query),

  listReminders: (): Promise<ReminderItem[]> => ipcRenderer.invoke('reminders:list'),

  getAvailableYears: (): Promise<number[]> => ipcRenderer.invoke('reports:getAvailableYears'),
  getTotalSpend: (year: number, vehicleId?: number | null): Promise<number> =>
    ipcRenderer.invoke('reports:getTotalSpend', year, vehicleId),
  getSpendByVehicle: (year: number): Promise<SpendByVehicleRow[]> =>
    ipcRenderer.invoke('reports:getSpendByVehicle', year),
  getSpendByCategory: (year: number, vehicleId?: number | null): Promise<SpendByCategoryRow[]> =>
    ipcRenderer.invoke('reports:getSpendByCategory', year, vehicleId),
  getSpendByMonth: (year: number, vehicleId?: number | null): Promise<SpendByMonthRow[]> =>
    ipcRenderer.invoke('reports:getSpendByMonth', year, vehicleId),
  getVehicleCardSummaries: (year: number): Promise<VehicleCardSummary[]> =>
    ipcRenderer.invoke('reports:getVehicleCardSummaries', year),

  listImages: (entryId: number): Promise<EntryImage[]> => ipcRenderer.invoke('images:list', entryId),
  listVehicleImages: (vehicleId: number): Promise<VehicleGalleryImage[]> =>
    ipcRenderer.invoke('images:listForVehicle', vehicleId),
  addImage: (entryId: number, caption?: string | null): Promise<EntryImage | null> =>
    ipcRenderer.invoke('images:add', entryId, caption),
  deleteImage: (id: number): Promise<boolean> => ipcRenderer.invoke('images:delete', id),
  updateImageCaption: (id: number, caption: string | null): Promise<EntryImage> =>
    ipcRenderer.invoke('images:updateCaption', id, caption),
  resolveImagePath: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke('images:resolvePath', relativePath),
  readImageAsDataUrl: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke('images:readAsDataUrl', relativePath),

  exportBackup: (): Promise<string | null> => ipcRenderer.invoke('backup:export'),
  restoreBackup: (): Promise<AppSettings | null> => ipcRenderer.invoke('backup:restore'),
  dismissBackupReminder: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:dismissBackupReminder'),

  clearReminder: (entryId: number): Promise<ServiceEntry> =>
    ipcRenderer.invoke('reminders:clear', entryId),
  snoozeReminder: (
    entryId: number,
    options: { days?: number; km?: number }
  ): Promise<ServiceEntry> => ipcRenderer.invoke('reminders:snooze', entryId, options),

  exportEntriesCsv: (vehicleId?: number | null): Promise<string | null> =>
    ipcRenderer.invoke('export:entriesCsv', vehicleId),
  exportRemindersCsv: (): Promise<string | null> => ipcRenderer.invoke('export:remindersCsv'),
  exportVehiclePdf: (vehicleId: number, year?: number): Promise<string | null> =>
    ipcRenderer.invoke('export:vehiclePdf', vehicleId, year),

  onNavigate: (callback: (path: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, path: string) => callback(path)
    ipcRenderer.on('app:navigate', listener)
    return () => ipcRenderer.removeListener('app:navigate', listener)
  }
}

contextBridge.exposeInMainWorld('servicekeep', api)

export type ServiceKeepApi = typeof api
