import type { Vehicle, VehicleInput } from '../../shared/types'
import { parseIntervalOverrides, serializeIntervalOverrides } from '../../shared/intervals'
import { getDb, nowIso } from '../db'

type VehicleRow = {
  id: number
  name: string
  make: string | null
  model: string | null
  year: number | null
  current_km: number
  fuel_type: string | null
  engine_notes: string | null
  vin: string | null
  license_plate: string | null
  color: string | null
  interval_overrides: string | null
  photo_path: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

function cleanOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    currentKm: row.current_km,
    fuelType: row.fuel_type,
    engineNotes: row.engine_notes,
    vin: row.vin ?? null,
    licensePlate: row.license_plate ?? null,
    color: row.color ?? null,
    intervalOverrides: parseIntervalOverrides(row.interval_overrides),
    photoPath: row.photo_path,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listVehicles(includeArchived = false): Vehicle[] {
  const db = getDb()
  const rows = includeArchived
    ? (db.prepare('SELECT * FROM vehicles ORDER BY name COLLATE NOCASE').all() as VehicleRow[])
    : (db
        .prepare('SELECT * FROM vehicles WHERE archived_at IS NULL ORDER BY name COLLATE NOCASE')
        .all() as VehicleRow[])
  return rows.map(mapVehicle)
}

export function getVehicle(id: number): Vehicle | null {
  const row = getDb().prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleRow | undefined
  return row ? mapVehicle(row) : null
}

export function createVehicle(input: VehicleInput): Vehicle {
  const ts = nowIso()
  const result = getDb()
    .prepare(
      `INSERT INTO vehicles
        (name, make, model, year, current_km, fuel_type, engine_notes,
         vin, license_plate, color, interval_overrides,
         archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
    )
    .run(
      input.name.trim(),
      cleanOptionalText(input.make ?? null),
      cleanOptionalText(input.model ?? null),
      input.year ?? null,
      input.currentKm ?? 0,
      cleanOptionalText(input.fuelType ?? null),
      cleanOptionalText(input.engineNotes ?? null),
      cleanOptionalText(input.vin?.toUpperCase() ?? null),
      cleanOptionalText(input.licensePlate?.toUpperCase() ?? null),
      cleanOptionalText(input.color ?? null),
      serializeIntervalOverrides(input.intervalOverrides),
      ts,
      ts
    )

  const vehicle = getVehicle(Number(result.lastInsertRowid))
  if (!vehicle) {
    throw new Error('Failed to create vehicle.')
  }
  return vehicle
}

export function updateVehicle(id: number, input: Partial<VehicleInput>): Vehicle {
  const existing = getVehicle(id)
  if (!existing) {
    throw new Error('Vehicle not found.')
  }

  const ts = nowIso()
  const vin =
    input.vin !== undefined ? cleanOptionalText(input.vin?.toUpperCase() ?? null) : existing.vin
  const licensePlate =
    input.licensePlate !== undefined
      ? cleanOptionalText(input.licensePlate?.toUpperCase() ?? null)
      : existing.licensePlate
  const color =
    input.color !== undefined ? cleanOptionalText(input.color ?? null) : existing.color
  const intervalOverrides =
    input.intervalOverrides !== undefined
      ? serializeIntervalOverrides(input.intervalOverrides)
      : serializeIntervalOverrides(existing.intervalOverrides)

  getDb()
    .prepare(
      `UPDATE vehicles SET
        name = ?, make = ?, model = ?, year = ?, current_km = ?,
        fuel_type = ?, engine_notes = ?, vin = ?, license_plate = ?, color = ?,
        interval_overrides = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.name?.trim() ?? existing.name,
      input.make !== undefined ? cleanOptionalText(input.make) : existing.make,
      input.model !== undefined ? cleanOptionalText(input.model) : existing.model,
      input.year !== undefined ? input.year : existing.year,
      input.currentKm !== undefined ? input.currentKm : existing.currentKm,
      input.fuelType !== undefined ? cleanOptionalText(input.fuelType) : existing.fuelType,
      input.engineNotes !== undefined ? cleanOptionalText(input.engineNotes) : existing.engineNotes,
      vin,
      licensePlate,
      color,
      intervalOverrides,
      ts,
      id
    )

  const vehicle = getVehicle(id)
  if (!vehicle) {
    throw new Error('Vehicle not found after update.')
  }
  return vehicle
}

export function archiveVehicle(id: number): Vehicle {
  const ts = nowIso()
  getDb().prepare('UPDATE vehicles SET archived_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, id)
  const vehicle = getVehicle(id)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }
  return vehicle
}

export function restoreVehicle(id: number): Vehicle {
  const ts = nowIso()
  getDb()
    .prepare('UPDATE vehicles SET archived_at = NULL, updated_at = ? WHERE id = ?')
    .run(ts, id)
  const vehicle = getVehicle(id)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }
  return vehicle
}

export function deleteVehiclePermanently(id: number): void {
  getDb().prepare('DELETE FROM vehicles WHERE id = ?').run(id)
}
