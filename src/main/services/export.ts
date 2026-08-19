import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import type { EntryCategory } from '../../shared/types'
import { ENTRY_CATEGORIES } from '../../shared/types'
import { listEntries } from './entries'
import { listReminders } from './entries'
import { getVehicle, listVehicles } from './vehicles'
import { getSpendByCategory, getTotalSpend } from './reports'

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function categoryLabel(category: EntryCategory): string {
  return ENTRY_CATEGORIES.find((item) => item.id === category)?.label ?? category
}

function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','))
  }
  return `\uFEFF${lines.join('\r\n')}`
}

async function saveCsv(content: string, defaultName: string): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = win
    ? await dialog.showSaveDialog(win, {
        title: 'Save CSV export',
        defaultPath: defaultName,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      })
    : await dialog.showSaveDialog({
        title: 'Save CSV export',
        defaultPath: defaultName,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      })

  if (result.canceled || !result.filePath) {
    return null
  }

  fs.writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
}

async function savePdf(html: string, defaultName: string): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = win
    ? await dialog.showSaveDialog(win, {
        title: 'Save PDF export',
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
    : await dialog.showSaveDialog({
        title: 'Save PDF export',
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })

  if (result.canceled || !result.filePath) {
    return null
  }

  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true }
  })

  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
    })
    fs.writeFileSync(result.filePath, pdf)
    return result.filePath
  } finally {
    pdfWindow.destroy()
  }
}

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return `€${value.toFixed(2)}`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 10)
}

export async function exportEntriesCsv(vehicleId?: number | null): Promise<string | null> {
  const vehicles = listVehicles(false)
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name]))
  const entries = listEntries(vehicleId ?? undefined)

  const headers = [
    'Vehicle',
    'Date',
    'Category',
    'Title',
    'Cost (EUR)',
    'Odometer (km)',
    'Next due date',
    'Next due km',
    'Comment'
  ]

  const rows = entries.map((entry) => [
    vehicleMap.get(entry.vehicleId) ?? String(entry.vehicleId),
    formatDate(entry.performedAt),
    categoryLabel(entry.category),
    entry.title,
    entry.costEur ?? '',
    entry.odometerKm ?? '',
    formatDate(entry.nextDueDate),
    entry.nextDueKm ?? '',
    entry.comment ?? ''
  ])

  const suffix = vehicleId != null ? `-vehicle-${vehicleId}` : '-all'
  return saveCsv(buildCsv(headers, rows), `servicekeep-entries${suffix}.csv`)
}

export async function exportRemindersCsv(): Promise<string | null> {
  const reminders = listReminders()
  const headers = [
    'Vehicle',
    'Title',
    'Category',
    'Due date',
    'Due km',
    'Current km',
    'Status'
  ]

  const rows = reminders.map((item) => [
    item.vehicleName,
    item.title,
    categoryLabel(item.category),
    formatDate(item.nextDueDate),
    item.nextDueKm ?? '',
    item.currentKm,
    item.isOverdue ? 'Overdue' : item.isDue ? 'Due' : 'Upcoming'
  ])

  return saveCsv(buildCsv(headers, rows), 'servicekeep-reminders.csv')
}

export async function exportVehicleHistoryPdf(vehicleId: number, year?: number): Promise<string | null> {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }

  const entries = listEntries(vehicleId)
  const reportYear = year ?? new Date().getFullYear()
  const yearEntries = entries.filter(
    (entry) => formatDate(entry.performedAt).startsWith(String(reportYear))
  )
  const totalSpend = getTotalSpend(reportYear, vehicleId)
  const byCategory = getSpendByCategory(reportYear, vehicleId)

  const subtitle = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ')
  const identity = [vehicle.licensePlate, vehicle.vin ? `VIN ${vehicle.vin}` : null, vehicle.color]
    .filter(Boolean)
    .join(' · ')
  const generatedAt = new Date().toISOString().slice(0, 10)

  const categoryRows = byCategory
    .map(
      (row) =>
        `<tr><td>${categoryLabel(row.category)}</td><td>${row.entryCount}</td><td>${formatMoney(row.totalEur)}</td></tr>`
    )
    .join('')

  const entryRows = (yearEntries.length > 0 ? yearEntries : entries)
    .slice(0, 200)
    .map(
      (entry) =>
        `<tr>
          <td>${formatDate(entry.performedAt)}</td>
          <td>${categoryLabel(entry.category)}</td>
          <td>${entry.title}</td>
          <td>${formatMoney(entry.costEur)}</td>
          <td>${entry.odometerKm ?? '—'}</td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ServiceKeep — ${vehicle.name}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
    h1 { margin: 0 0 4px; font-size: 24px; }
    .muted { color: #555; margin-bottom: 24px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; }
    .stat strong { display: block; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 8px; font-size: 12px; }
    th { background: #f5f5f5; }
    h2 { margin-top: 28px; font-size: 16px; }
  </style>
</head>
<body>
  <h1>${vehicle.name}</h1>
  <div class="muted">${subtitle || 'Service history'}${identity ? ` · ${identity}` : ''} · Generated ${generatedAt}</div>
  <div class="stats">
    <div class="stat"><span>Current km</span><strong>${vehicle.currentKm.toLocaleString('en-GB')} km</strong></div>
    <div class="stat"><span>Spend ${reportYear}</span><strong>${formatMoney(totalSpend)}</strong></div>
    <div class="stat"><span>Entries listed</span><strong>${(yearEntries.length > 0 ? yearEntries : entries).length}</strong></div>
  </div>
  <h2>Spend by category (${reportYear})</h2>
  <table>
    <thead><tr><th>Category</th><th>Entries</th><th>Total</th></tr></thead>
    <tbody>${categoryRows || '<tr><td colspan="3">No spend recorded.</td></tr>'}</tbody>
  </table>
  <h2>Service log${yearEntries.length > 0 ? ` (${reportYear})` : ''}</h2>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Title</th><th>Cost</th><th>Km</th></tr></thead>
    <tbody>${entryRows || '<tr><td colspan="5">No entries yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`

  const safeName = vehicle.name.replace(/[^\w\-]+/g, '-').toLowerCase()
  return savePdf(html, `servicekeep-${safeName}-history.pdf`)
}
