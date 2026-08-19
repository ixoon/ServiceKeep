export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 10)
}

export function formatKm(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toLocaleString('en-GB')} km`
}

export function formatEur(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

export function formatCategory(value: string): string {
  return value.replaceAll('_', ' ')
}

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`
}
