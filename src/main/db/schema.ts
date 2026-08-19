export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  current_km REAL NOT NULL DEFAULT 0,
  fuel_type TEXT,
  engine_notes TEXT,
  vin TEXT,
  license_plate TEXT,
  color TEXT,
  interval_overrides TEXT,
  photo_path TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  comment TEXT,
  cost_eur REAL,
  odometer_km REAL,
  performed_at TEXT NOT NULL,
  next_due_date TEXT,
  next_due_km REAL,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entry_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  caption TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES service_entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_archived ON vehicles(archived_at);
CREATE INDEX IF NOT EXISTS idx_entries_vehicle ON service_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_entries_category ON service_entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_performed ON service_entries(performed_at);
CREATE INDEX IF NOT EXISTS idx_entries_next_due_date ON service_entries(next_due_date);
CREATE INDEX IF NOT EXISTS idx_images_entry ON entry_images(entry_id);
`

export const DB_SCHEMA_VERSION = 4
