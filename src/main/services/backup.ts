import fs from 'fs'
import path from 'path'
import { closeDb, getCurrentDataPath, getDb, initDb } from '../db'

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to)
    }
  }
}

export function backupToFolder(targetFolder: string): string {
  const dataPath = getCurrentDataPath()
  if (!dataPath) {
    throw new Error('No data folder selected.')
  }

  // Checkpoint WAL so data.db is self-contained
  getDb().pragma('wal_checkpoint(FULL)')

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dest = path.join(targetFolder, `servicekeep-backup-${stamp}`)
  fs.mkdirSync(dest, { recursive: true })

  fs.copyFileSync(path.join(dataPath, 'data.db'), path.join(dest, 'data.db'))
  const imagesSrc = path.join(dataPath, 'images')
  if (fs.existsSync(imagesSrc)) {
    copyDir(imagesSrc, path.join(dest, 'images'))
  }

  return dest
}

export function restoreFromFolder(backupFolder: string, dataPath: string): void {
  const dbFile = path.join(backupFolder, 'data.db')
  if (!fs.existsSync(dbFile)) {
    throw new Error('Backup folder must contain data.db')
  }

  fs.mkdirSync(dataPath, { recursive: true })

  closeDb()

  fs.copyFileSync(dbFile, path.join(dataPath, 'data.db'))

  const imagesSrc = path.join(backupFolder, 'images')
  const imagesDest = path.join(dataPath, 'images')
  if (fs.existsSync(imagesDest)) {
    fs.rmSync(imagesDest, { recursive: true, force: true })
  }
  if (fs.existsSync(imagesSrc)) {
    copyDir(imagesSrc, imagesDest)
  } else {
    fs.mkdirSync(imagesDest, { recursive: true })
  }

  initDb(dataPath)
}
