import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { runMigrations } from './migrations'
import { DB_SCHEMA_VERSION, SCHEMA_SQL } from './schema'

let db: Database.Database | null = null
let currentDataPath: string | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database is not initialized. Choose a data folder first.')
  }
  return db
}

export function getCurrentDataPath(): string | null {
  return currentDataPath
}

export function getImagesDir(dataPath = currentDataPath): string {
  if (!dataPath) {
    throw new Error('Data path is not set.')
  }
  return path.join(dataPath, 'images')
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
  currentDataPath = null
}

export function initDb(dataPath: string): void {
  fs.mkdirSync(dataPath, { recursive: true })
  fs.mkdirSync(path.join(dataPath, 'images'), { recursive: true })

  closeDb()

  const dbFile = path.join(dataPath, 'data.db')
  db = new Database(dbFile)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)

  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as
    | { value: string }
    | undefined

  if (!row) {
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(
      'schema_version',
      String(DB_SCHEMA_VERSION)
    )
  }

  runMigrations(db)

  currentDataPath = dataPath
}

export function nowIso(): string {
  return new Date().toISOString()
}
