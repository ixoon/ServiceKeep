import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AppSettings, ThemeMode } from '../../shared/types'

const DEFAULT_SETTINGS: AppSettings = {
  dataPath: null,
  theme: 'dark',
  activeVehicleId: null,
  notificationsEnabled: true,
  onboardingComplete: false,
  lastBackupAt: null,
  backupReminderDismissedAt: null,
  lastNotificationAt: null
}

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'app-settings.json')
}

export function readSettings(): AppSettings {
  try {
    const file = settingsPath()
    if (!fs.existsSync(file)) {
      return { ...DEFAULT_SETTINGS }
    }
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<AppSettings>
    return {
      dataPath: raw.dataPath ?? null,
      theme: raw.theme === 'light' ? 'light' : 'dark',
      activeVehicleId: typeof raw.activeVehicleId === 'number' ? raw.activeVehicleId : null,
      notificationsEnabled: raw.notificationsEnabled !== false,
      onboardingComplete: Boolean(raw.onboardingComplete),
      lastBackupAt: typeof raw.lastBackupAt === 'string' ? raw.lastBackupAt : null,
      backupReminderDismissedAt:
        typeof raw.backupReminderDismissedAt === 'string' ? raw.backupReminderDismissedAt : null,
      lastNotificationAt: typeof raw.lastNotificationAt === 'string' ? raw.lastNotificationAt : null
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function writeSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...readSettings(), ...patch }
  const file = settingsPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(next, null, 2), 'utf-8')
  return next
}

export function setTheme(theme: ThemeMode): AppSettings {
  return writeSettings({ theme })
}
