import type {
  EntryCategory,
  SpendByCategoryRow,
  SpendByMonthRow,
  SpendByVehicleRow,
  VehicleCardSummary
} from '../../shared/types'
import { getDb } from '../db'
import { listReminders } from './entries'

function yearFilter(year: number, vehicleId?: number | null): { sql: string; params: unknown[] } {
  const params: unknown[] = [year]
  let sql = `
    FROM service_entries e
    JOIN vehicles v ON v.id = e.vehicle_id
    WHERE e.archived_at IS NULL
      AND v.archived_at IS NULL
      AND CAST(strftime('%Y', e.performed_at) AS INTEGER) = ?`

  if (vehicleId != null) {
    sql += ' AND e.vehicle_id = ?'
    params.push(vehicleId)
  }

  return { sql, params }
}

export function getTotalSpend(year: number, vehicleId?: number | null): number {
  const { sql, params } = yearFilter(year, vehicleId)
  const row = getDb()
    .prepare(`SELECT COALESCE(SUM(COALESCE(e.cost_eur, 0)), 0) as total ${sql}`)
    .get(...params) as { total: number }
  return row.total
}

export function getSpendByVehicle(year: number): SpendByVehicleRow[] {
  const { sql, params } = yearFilter(year)
  const rows = getDb()
    .prepare(
      `SELECT
         v.id as vehicle_id,
         v.name as vehicle_name,
         COALESCE(SUM(COALESCE(e.cost_eur, 0)), 0) as total_eur
       ${sql}
       GROUP BY v.id, v.name
       ORDER BY total_eur DESC, v.name COLLATE NOCASE`
    )
    .all(...params) as Array<{ vehicle_id: number; vehicle_name: string; total_eur: number }>

  return rows.map((row) => ({
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    totalEur: row.total_eur
  }))
}

export function getSpendByCategory(
  year: number,
  vehicleId?: number | null
): SpendByCategoryRow[] {
  const { sql, params } = yearFilter(year, vehicleId)
  const rows = getDb()
    .prepare(
      `SELECT
         e.category as category,
         COALESCE(SUM(COALESCE(e.cost_eur, 0)), 0) as total_eur,
         COUNT(*) as entry_count
       ${sql}
       GROUP BY e.category
       ORDER BY total_eur DESC`
    )
    .all(...params) as Array<{ category: EntryCategory; total_eur: number; entry_count: number }>

  return rows.map((row) => ({
    category: row.category,
    totalEur: row.total_eur,
    entryCount: row.entry_count
  }))
}

export function getSpendByMonth(year: number, vehicleId?: number | null): SpendByMonthRow[] {
  const { sql, params } = yearFilter(year, vehicleId)
  const rows = getDb()
    .prepare(
      `SELECT
         CAST(strftime('%Y', e.performed_at) AS INTEGER) as year,
         CAST(strftime('%m', e.performed_at) AS INTEGER) as month,
         COALESCE(SUM(COALESCE(e.cost_eur, 0)), 0) as total_eur
       ${sql}
       GROUP BY year, month
       ORDER BY month ASC`
    )
    .all(...params) as Array<{ year: number; month: number; total_eur: number }>

  const byMonth = new Map<number, number>()
  for (const row of rows) {
    byMonth.set(row.month, row.total_eur)
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return {
      year,
      month,
      totalEur: byMonth.get(month) ?? 0
    }
  })
}

export function getAvailableYears(): number[] {
  const row = getDb()
    .prepare(
      `SELECT
         MIN(CAST(strftime('%Y', performed_at) AS INTEGER)) as min_year,
         MAX(CAST(strftime('%Y', performed_at) AS INTEGER)) as max_year
       FROM service_entries
       WHERE archived_at IS NULL`
    )
    .get() as { min_year: number | null; max_year: number | null }

  const currentYear = new Date().getFullYear()
  if (row.min_year == null || row.max_year == null) {
    return [currentYear]
  }

  const years: number[] = []
  for (let year = row.max_year; year >= row.min_year; year--) {
    years.push(year)
  }
  if (!years.includes(currentYear)) {
    years.unshift(currentYear)
    years.sort((a, b) => b - a)
  }
  return years
}

export function getVehicleCardSummaries(year: number): VehicleCardSummary[] {
  const vehicles = getDb()
    .prepare('SELECT id FROM vehicles WHERE archived_at IS NULL ORDER BY name COLLATE NOCASE')
    .all() as Array<{ id: number }>

  const spendRows = getDb()
    .prepare(
      `SELECT
         e.vehicle_id as vehicle_id,
         COALESCE(SUM(COALESCE(e.cost_eur, 0)), 0) as total_eur
       FROM service_entries e
       JOIN vehicles v ON v.id = e.vehicle_id
       WHERE e.archived_at IS NULL
         AND v.archived_at IS NULL
         AND CAST(strftime('%Y', e.performed_at) AS INTEGER) = ?
       GROUP BY e.vehicle_id`
    )
    .all(year) as Array<{ vehicle_id: number; total_eur: number }>

  const spendByVehicle = new Map(spendRows.map((row) => [row.vehicle_id, row.total_eur]))

  const reminders = listReminders().filter((item) => item.isDue)

  return vehicles.map((vehicle) => {
    const vehicleReminders = reminders
      .filter((item) => item.vehicleId === vehicle.id)
      .sort((a, b) => {
        const aDate = a.nextDueDate?.slice(0, 10) ?? '9999-99-99'
        const bDate = b.nextDueDate?.slice(0, 10) ?? '9999-99-99'
        if (aDate !== bDate) return aDate.localeCompare(bDate)
        return (a.nextDueKm ?? Infinity) - (b.nextDueKm ?? Infinity)
      })

    const next = vehicleReminders[0] ?? null

    return {
      vehicleId: vehicle.id,
      spentThisYear: spendByVehicle.get(vehicle.id) ?? 0,
      nextServiceTitle: next?.title ?? null,
      nextServiceDueDate: next?.nextDueDate ?? null,
      nextServiceDueKm: next?.nextDueKm ?? null,
      isNextOverdue: next?.isOverdue ?? false
    }
  })
}
