import type { ReminderItem } from '../../../shared/types'

export function countReminders(reminders: ReminderItem[]) {
  const due = reminders.filter((item) => item.isDue)
  const overdue = due.filter((item) => item.isOverdue)
  return {
    due: due.length,
    overdue: overdue.length,
    items: due,
    overdueItems: overdue
  }
}
