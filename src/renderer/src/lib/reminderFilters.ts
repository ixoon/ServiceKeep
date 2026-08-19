import type { ReminderItem, ReminderStatusFilter } from '../../../shared/types'

export function getReminderStatus(item: ReminderItem): 'overdue' | 'due' | 'upcoming' {
  if (item.isOverdue) return 'overdue'
  if (item.isDue) return 'due'
  return 'upcoming'
}

export function filterReminders(
  reminders: ReminderItem[],
  status: ReminderStatusFilter
): ReminderItem[] {
  if (status === 'all') return reminders
  return reminders.filter((item) => getReminderStatus(item) === status)
}

export function sortReminders(reminders: ReminderItem[]): ReminderItem[] {
  const order = { overdue: 0, due: 1, upcoming: 2 }
  return [...reminders].sort((a, b) => {
    const statusDiff = order[getReminderStatus(a)] - order[getReminderStatus(b)]
    if (statusDiff !== 0) return statusDiff
    const aDate = a.nextDueDate?.slice(0, 10) ?? '9999-99-99'
    const bDate = b.nextDueDate?.slice(0, 10) ?? '9999-99-99'
    if (aDate !== bDate) return aDate.localeCompare(bDate)
    return (a.nextDueKm ?? Infinity) - (b.nextDueKm ?? Infinity)
  })
}
