import { Notification } from 'electron'
import { listReminders } from './entries'
import { readSettings, writeSettings } from './settings'
import { refreshTrayBadge } from './tray'

const DAILY_MS = 24 * 60 * 60 * 1000

function shouldNotifyToday(): boolean {
  const settings = readSettings()
  if (!settings.lastNotificationAt) return true
  const last = new Date(settings.lastNotificationAt).getTime()
  return Date.now() - last >= DAILY_MS
}

export function showReminderNotifications(): void {
  const settings = readSettings()
  if (!settings.notificationsEnabled || !settings.dataPath) {
    return
  }

  if (!Notification.isSupported()) {
    return
  }

  const reminders = listReminders().filter((item) => item.isDue)
  if (reminders.length === 0) {
    refreshTrayBadge()
    return
  }

  const overdue = reminders.filter((item) => item.isOverdue)
  const dueOnly = reminders.filter((item) => !item.isOverdue)

  if (overdue.length > 0) {
    const title =
      overdue.length === 1
        ? `${overdue[0].vehicleName}: ${overdue[0].title}`
        : `${overdue.length} overdue reminders`

    const body =
      overdue.length === 1
        ? 'This service item is overdue. Open ServiceKeep to review.'
        : overdue
            .slice(0, 3)
            .map((item) => `${item.vehicleName} — ${item.title}`)
            .join('\n')

    new Notification({ title: `Overdue: ${title}`, body }).show()
  } else if (dueOnly.length > 0) {
    const title =
      dueOnly.length === 1
        ? `${dueOnly[0].vehicleName}: ${dueOnly[0].title}`
        : `${dueOnly.length} items due soon`

    const body =
      dueOnly.length === 1
        ? 'A service reminder is due. Open ServiceKeep to review.'
        : dueOnly
            .slice(0, 3)
            .map((item) => `${item.vehicleName} — ${item.title}`)
            .join('\n')

    new Notification({ title: `Due: ${title}`, body }).show()
  }

  writeSettings({ lastNotificationAt: new Date().toISOString() })
  refreshTrayBadge()
}

export function showStartupReminderNotifications(): void {
  showReminderNotifications()
}

export function startPeriodicReminderNotifications(): void {
  setInterval(() => {
    if (!shouldNotifyToday()) return
    showReminderNotifications()
  }, DAILY_MS)
}

export function notifyRemindersIfDue(): void {
  if (!shouldNotifyToday()) return
  showReminderNotifications()
}
