import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as
    | { value: string }
    | undefined

  let version = row ? Number(row.value) : 0

  if (version < 2) {
    const columns = db.prepare('PRAGMA table_info(entry_images)').all() as { name: string }[]
    if (!columns.some((column) => column.name === 'caption')) {
      db.exec('ALTER TABLE entry_images ADD COLUMN caption TEXT')
    }
    version = 2
  }

  if (version < 3) {
    const vehicleColumns = db.prepare('PRAGMA table_info(vehicles)').all() as { name: string }[]
    if (!vehicleColumns.some((column) => column.name === 'photo_path')) {
      db.exec('ALTER TABLE vehicles ADD COLUMN photo_path TEXT')
    }
    version = 3
  }

  if (version < 4) {
    const vehicleColumns = db.prepare('PRAGMA table_info(vehicles)').all() as { name: string }[]
    const names = new Set(vehicleColumns.map((column) => column.name))
    if (!names.has('vin')) {
      db.exec('ALTER TABLE vehicles ADD COLUMN vin TEXT')
    }
    if (!names.has('license_plate')) {
      db.exec('ALTER TABLE vehicles ADD COLUMN license_plate TEXT')
    }
    if (!names.has('color')) {
      db.exec('ALTER TABLE vehicles ADD COLUMN color TEXT')
    }
    if (!names.has('interval_overrides')) {
      db.exec('ALTER TABLE vehicles ADD COLUMN interval_overrides TEXT')
    }
    version = 4
  }

  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(
    'schema_version',
    String(version)
  )
}
