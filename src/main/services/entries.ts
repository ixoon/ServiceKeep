import type {
  EntryCategory,
  ReminderItem,
  SearchHit,
  ServiceEntry,
  ServiceEntryInput
} from '../../shared/types'
import { getDb, nowIso } from '../db'

type EntryRow = {
  id: number
  vehicle_id: number
  category: ServiceEntry['category']
  title: string
  comment: string | null
  cost_eur: number | null
  odometer_km: number | null
  performed_at: string
  next_due_date: string | null
  next_due_km: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

function mapEntry(row: EntryRow): ServiceEntry {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    category: row.category,
    title: row.title,
    comment: row.comment,
    costEur: row.cost_eur,
    odometerKm: row.odometer_km,
    performedAt: row.performed_at,
    nextDueDate: row.next_due_date,
    nextDueKm: row.next_due_km,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listEntries(vehicleId?: number, includeArchived = false): ServiceEntry[] {
  const db = getDb()
  let sql = 'SELECT * FROM service_entries WHERE 1=1'
  const params: unknown[] = []

  if (vehicleId != null) {
    sql += ' AND vehicle_id = ?'
    params.push(vehicleId)
  }
  if (!includeArchived) {
    sql += ' AND archived_at IS NULL'
  }
  sql += ' ORDER BY performed_at DESC, id DESC'

  const rows = db.prepare(sql).all(...params) as EntryRow[]
  return rows.map(mapEntry)
}

export function getEntry(id: number): ServiceEntry | null {
  const row = getDb().prepare('SELECT * FROM service_entries WHERE id = ?').get(id) as
    | EntryRow
    | undefined
  return row ? mapEntry(row) : null
}

export function createEntry(input: ServiceEntryInput): ServiceEntry {
  const ts = nowIso()
  const result = getDb()
    .prepare(
      `INSERT INTO service_entries
        (vehicle_id, category, title, comment, cost_eur, odometer_km, performed_at,
         next_due_date, next_due_km, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
    )
    .run(
      input.vehicleId,
      input.category,
      input.title.trim(),
      input.comment ?? null,
      input.costEur ?? null,
      input.odometerKm ?? null,
      input.performedAt,
      input.nextDueDate ?? null,
      input.nextDueKm ?? null,
      ts,
      ts
    )

  if (input.odometerKm != null) {
    getDb()
      .prepare(
        `UPDATE vehicles
         SET current_km = CASE WHEN current_km < ? THEN ? ELSE current_km END,
             updated_at = ?
         WHERE id = ?`
      )
      .run(input.odometerKm, input.odometerKm, ts, input.vehicleId)
  }

  const entry = getEntry(Number(result.lastInsertRowid))
  if (!entry) {
    throw new Error('Failed to create entry.')
  }
  return entry
}

export function updateEntry(id: number, input: Partial<ServiceEntryInput>): ServiceEntry {
  const existing = getEntry(id)
  if (!existing) {
    throw new Error('Entry not found.')
  }

  const ts = nowIso()
  getDb()
    .prepare(
      `UPDATE service_entries SET
        category = ?, title = ?, comment = ?, cost_eur = ?, odometer_km = ?,
        performed_at = ?, next_due_date = ?, next_due_km = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.category ?? existing.category,
      input.title?.trim() ?? existing.title,
      input.comment !== undefined ? input.comment : existing.comment,
      input.costEur !== undefined ? input.costEur : existing.costEur,
      input.odometerKm !== undefined ? input.odometerKm : existing.odometerKm,
      input.performedAt ?? existing.performedAt,
      input.nextDueDate !== undefined ? input.nextDueDate : existing.nextDueDate,
      input.nextDueKm !== undefined ? input.nextDueKm : existing.nextDueKm,
      ts,
      id
    )

  const entry = getEntry(id)
  if (!entry) {
    throw new Error('Entry not found after update.')
  }
  return entry
}

export function archiveEntry(id: number): ServiceEntry {
  const ts = nowIso()
  getDb()
    .prepare('UPDATE service_entries SET archived_at = ?, updated_at = ? WHERE id = ?')
    .run(ts, ts, id)
  const entry = getEntry(id)
  if (!entry) {
    throw new Error('Entry not found.')
  }
  return entry
}

export function restoreEntry(id: number): ServiceEntry {
  const ts = nowIso()
  getDb()
    .prepare('UPDATE service_entries SET archived_at = NULL, updated_at = ? WHERE id = ?')
    .run(ts, id)
  const entry = getEntry(id)
  if (!entry) {
    throw new Error('Entry not found.')
  }
  return entry
}

export function deleteEntryPermanently(id: number): void {
  getDb().prepare('DELETE FROM service_entries WHERE id = ?').run(id)
}

function likePattern(query: string): string {
  return `%${query.replace(/[%_]/g, ' ')}%`
}

export function searchGarage(query: string): SearchHit[] {
  const trimmed = query.trim()
  if (trimmed.length < 1) {
    return []
  }

  const pattern = likePattern(trimmed)
  const db = getDb()

  const entryRows = db
    .prepare(
      `SELECT
         e.id as id,
         e.vehicle_id as vehicle_id,
         v.name as vehicle_name,
         e.title as title,
         e.comment as snippet,
         e.category as category,
         e.performed_at as performed_at
       FROM service_entries e
       JOIN vehicles v ON v.id = e.vehicle_id
       WHERE e.archived_at IS NULL
         AND v.archived_at IS NULL
         AND (
           e.title LIKE ?
           OR IFNULL(e.comment, '') LIKE ?
         )
       ORDER BY e.performed_at DESC, e.id DESC
       LIMIT 30`
    )
    .all(pattern, pattern) as Array<{
    id: number
    vehicle_id: number
    vehicle_name: string
    title: string
    snippet: string | null
    category: EntryCategory
    performed_at: string
  }>

  const vehicleRows = db
    .prepare(
      `SELECT
         v.id as id,
         v.name as name,
         v.make as make,
         v.model as model,
         v.vin as vin,
         v.license_plate as license_plate,
         v.color as color
       FROM vehicles v
       WHERE v.archived_at IS NULL
         AND (
           v.name LIKE ?
           OR IFNULL(v.make, '') LIKE ?
           OR IFNULL(v.model, '') LIKE ?
           OR IFNULL(v.vin, '') LIKE ?
           OR IFNULL(v.license_plate, '') LIKE ?
           OR IFNULL(v.color, '') LIKE ?
         )
       ORDER BY v.name COLLATE NOCASE
       LIMIT 10`
    )
    .all(pattern, pattern, pattern, pattern, pattern, pattern) as Array<{
    id: number
    name: string
    make: string | null
    model: string | null
    vin: string | null
    license_plate: string | null
    color: string | null
  }>

  const vehicles: SearchHit[] = vehicleRows.map((row) => ({
    type: 'vehicle',
    id: row.id,
    vehicleId: row.id,
    vehicleName: row.name,
    title: row.name,
    snippet: [row.license_plate, row.vin, row.color, row.make, row.model]
      .filter(Boolean)
      .join(' · ') || null,
    category: null,
    performedAt: null
  }))

  const entries: SearchHit[] = entryRows.map((row) => ({
    type: 'entry',
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    title: row.title,
    snippet: row.snippet,
    category: row.category,
    performedAt: row.performed_at
  }))

  return [...vehicles, ...entries].slice(0, 40)
}

export function listReminders(): ReminderItem[] {
  const rows = getDb()
    .prepare(
      `SELECT
         e.id as entry_id,
         e.vehicle_id as vehicle_id,
         v.name as vehicle_name,
         e.title as title,
         e.category as category,
         e.next_due_date as next_due_date,
         e.next_due_km as next_due_km,
         v.current_km as current_km
       FROM service_entries e
       JOIN vehicles v ON v.id = e.vehicle_id
       WHERE e.archived_at IS NULL
         AND v.archived_at IS NULL
         AND (e.next_due_date IS NOT NULL OR e.next_due_km IS NOT NULL)
       ORDER BY
         CASE WHEN e.next_due_date IS NULL THEN 1 ELSE 0 END,
         e.next_due_date ASC,
         CASE WHEN e.next_due_km IS NULL THEN 1 ELSE 0 END,
         e.next_due_km ASC`
    )
    .all() as Array<{
    entry_id: number
    vehicle_id: number
    vehicle_name: string
    title: string
    category: ReminderItem['category']
    next_due_date: string | null
    next_due_km: number | null
    current_km: number
  }>

  const today = new Date().toISOString().slice(0, 10)

  return rows.map((row) => {
    const dateDue = row.next_due_date != null && row.next_due_date.slice(0, 10) <= today
    const kmDue = row.next_due_km != null && row.current_km >= row.next_due_km
    const isDue = dateDue || kmDue
    const isOverdue =
      (row.next_due_date != null && row.next_due_date.slice(0, 10) < today) ||
      (row.next_due_km != null && row.current_km > row.next_due_km)

    return {
      entryId: row.entry_id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      title: row.title,
      category: row.category,
      nextDueDate: row.next_due_date,
      nextDueKm: row.next_due_km,
      currentKm: row.current_km,
      isDue,
      isOverdue
    }
  })
}
