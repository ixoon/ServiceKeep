import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { EntryCategory, ServiceEntry } from '../../shared/types'
import { ENTRY_CATEGORIES } from '../../shared/types'
import { APP_NAME, APP_TAGLINE } from '../../shared/appMeta'
import { getAppIconPath } from './appMeta'
import { listEntries } from './entries'
import { listReminders } from './entries'
import { listImages, readImageAsDataUrl } from './images'
import { getVehicle, listVehicles } from './vehicles'
import { readVehiclePhotoAsDataUrl } from './vehiclePhotos'
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

  let filePath = result.filePath
  if (!filePath.toLowerCase().endsWith('.pdf')) {
    filePath += '.pdf'
  }

  const tempHtmlPath = path.join(os.tmpdir(), `servicekeep-pdf-${Date.now()}.html`)
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true }
  })

  try {
    fs.writeFileSync(tempHtmlPath, html, 'utf-8')
    await pdfWindow.loadFile(tempHtmlPath)
    await pdfWindow.webContents.executeJavaScript(`
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true })
                img.addEventListener('error', resolve, { once: true })
              })
        )
      )
    `)
    const pdf = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
    })
    fs.writeFileSync(filePath, pdf)
    return filePath
  } finally {
    pdfWindow.destroy()
    try {
      fs.unlinkSync(tempHtmlPath)
    } catch {
      // temp file may already be gone
    }
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readFileAsDataUrl(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null
  }
  const ext = path.extname(filePath).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
  const buffer = fs.readFileSync(filePath)
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function readLogoAsDataUrl(): string | null {
  const candidates = [
    getAppIconPath(),
    path.join(__dirname, '../../build/icon.png'),
    path.join(__dirname, '../../src/renderer/src/assets/logo.png')
  ]
  for (const candidate of candidates) {
    const dataUrl = readFileAsDataUrl(candidate)
    if (dataUrl) {
      return dataUrl
    }
  }
  return null
}

function buildInfoItem(label: string, value: string | number | null | undefined): string {
  if (value == null || value === '') {
    return ''
  }
  return `<div class="info-item"><span class="info-label">${escapeHtml(label)}</span><span class="info-value">${escapeHtml(String(value))}</span></div>`
}

function buildEntryImagesHtml(entryId: number): string {
  const images = listImages(entryId)
  if (images.length === 0) {
    return ''
  }

  const figures = images
    .map((image) => {
      try {
        const dataUrl = readImageAsDataUrl(image.relativePath)
        const caption = escapeHtml(image.caption ?? image.fileName)
        return `<figure class="entry-image"><img src="${dataUrl}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`
      } catch {
        return ''
      }
    })
    .filter(Boolean)
    .join('')

  if (!figures) {
    return ''
  }

  return `<div class="entry-images">${figures}</div>`
}

function buildEntryCard(entry: ServiceEntry): string {
  const nextDueParts: string[] = []
  if (entry.nextDueDate) {
    nextDueParts.push(`Date: ${formatDate(entry.nextDueDate)}`)
  }
  if (entry.nextDueKm != null) {
    nextDueParts.push(`Km: ${entry.nextDueKm.toLocaleString('en-GB')}`)
  }
  const nextDue =
    nextDueParts.length > 0
      ? `<span class="entry-stat"><strong>Next due</strong> ${escapeHtml(nextDueParts.join(' · '))}</span>`
      : ''

  const comment = entry.comment?.trim()
    ? `<div class="entry-comment">${escapeHtml(entry.comment)}</div>`
    : ''

  const images = buildEntryImagesHtml(entry.id)

  return `<article class="entry">
    <div class="entry-header">
      <div>
        <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
        <div class="entry-meta">${formatDate(entry.performedAt)} · ${escapeHtml(categoryLabel(entry.category))}</div>
      </div>
      <div class="entry-stats">
        <span class="entry-stat"><strong>Cost</strong> ${formatMoney(entry.costEur)}</span>
        <span class="entry-stat"><strong>Km</strong> ${entry.odometerKm != null ? entry.odometerKm.toLocaleString('en-GB') : '—'}</span>
        ${nextDue}
      </div>
    </div>
    ${comment}
    ${images}
  </article>`
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
  const listedEntries = (yearEntries.length > 0 ? yearEntries : entries).slice(0, 200)
  const totalSpend = getTotalSpend(reportYear, vehicleId)
  const byCategory = getSpendByCategory(reportYear, vehicleId)

  const subtitle = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ')
  const generatedAt = new Date().toISOString().slice(0, 10)
  const logoDataUrl = readLogoAsDataUrl()
  const vehiclePhotoDataUrl = readVehiclePhotoAsDataUrl(vehicleId)

  const vehicleInfoItems = [
    buildInfoItem('Make / model', subtitle || null),
    buildInfoItem('License plate', vehicle.licensePlate),
    buildInfoItem('VIN', vehicle.vin),
    buildInfoItem('Color', vehicle.color),
    buildInfoItem('Fuel type', vehicle.fuelType),
    buildInfoItem('Current km', `${vehicle.currentKm.toLocaleString('en-GB')} km`),
    buildInfoItem('Engine / oil notes', vehicle.engineNotes)
  ]
    .filter(Boolean)
    .join('')

  const categoryRows = byCategory
    .map(
      (row) =>
        `<tr><td>${escapeHtml(categoryLabel(row.category))}</td><td>${row.entryCount}</td><td>${formatMoney(row.totalEur)}</td></tr>`
    )
    .join('')

  const entryCards = listedEntries.map(buildEntryCard).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(APP_NAME)} — ${escapeHtml(vehicle.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; line-height: 1.45; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
    .app-name { font-size: 18px; font-weight: 700; margin: 0; }
    .app-tagline { color: #666; font-size: 12px; margin-top: 2px; }
    .vehicle-photo { width: 120px; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid #ddd; }
    h1 { margin: 0 0 6px; font-size: 26px; }
    .muted { color: #555; margin-bottom: 20px; font-size: 13px; }
    .vehicle-info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 24px; margin-bottom: 24px; padding: 16px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 10px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #777; font-weight: 700; }
    .info-value { font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
    .stat { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; background: #fff; }
    .stat span { display: block; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat strong { display: block; font-size: 18px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 8px; font-size: 12px; }
    th { background: #f5f5f5; }
    h2 { margin-top: 28px; font-size: 16px; }
    .entries { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .entry { border: 1px solid #ddd; border-radius: 10px; padding: 14px 16px; page-break-inside: avoid; background: #fff; }
    .entry-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px; }
    .entry-title { margin: 0 0 4px; font-size: 15px; }
    .entry-meta { font-size: 12px; color: #666; }
    .entry-stats { display: flex; flex-direction: column; gap: 4px; text-align: right; font-size: 12px; white-space: nowrap; }
    .entry-stat strong { color: #444; margin-right: 6px; }
    .entry-comment { margin-top: 10px; padding: 10px 12px; background: #f7f7f7; border-radius: 8px; font-size: 12px; white-space: pre-wrap; word-break: break-word; color: #222; }
    .entry-images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .entry-image { margin: 0; width: 140px; }
    .entry-image img { width: 100%; height: 105px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; display: block; }
    .entry-image figcaption { margin-top: 4px; font-size: 10px; color: #666; line-height: 1.3; word-break: break-word; }
    .empty-note { color: #666; font-size: 13px; font-style: italic; }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="brand">
      ${logoDataUrl ? `<img class="logo" src="${logoDataUrl}" alt="${escapeHtml(APP_NAME)}" />` : ''}
      <div>
        <p class="app-name">${escapeHtml(APP_NAME)}</p>
        <div class="app-tagline">${escapeHtml(APP_TAGLINE)}</div>
      </div>
    </div>
    ${vehiclePhotoDataUrl ? `<img class="vehicle-photo" src="${vehiclePhotoDataUrl}" alt="${escapeHtml(vehicle.name)}" />` : ''}
  </div>

  <h1>${escapeHtml(vehicle.name)}</h1>
  <div class="muted">Service history report · Generated ${generatedAt}${yearEntries.length > 0 ? ` · Period ${reportYear}` : ''}</div>

  ${vehicleInfoItems ? `<section class="vehicle-info">${vehicleInfoItems}</section>` : ''}

  <div class="stats">
    <div class="stat"><span>Current km</span><strong>${vehicle.currentKm.toLocaleString('en-GB')} km</strong></div>
    <div class="stat"><span>Spend ${reportYear}</span><strong>${formatMoney(totalSpend)}</strong></div>
    <div class="stat"><span>Entries listed</span><strong>${listedEntries.length}</strong></div>
  </div>

  <h2>Spend by category (${reportYear})</h2>
  <table>
    <thead><tr><th>Category</th><th>Entries</th><th>Total</th></tr></thead>
    <tbody>${categoryRows || '<tr><td colspan="3">No spend recorded.</td></tr>'}</tbody>
  </table>

  <h2>Service log${yearEntries.length > 0 ? ` (${reportYear})` : ''}</h2>
  ${entryCards ? `<div class="entries">${entryCards}</div>` : '<p class="empty-note">No entries yet.</p>'}
</body>
</html>`

  const safeName = vehicle.name.replace(/[^\w\-]+/g, '-').toLowerCase()
  return savePdf(html, `servicekeep-${safeName}-history.pdf`)
}
