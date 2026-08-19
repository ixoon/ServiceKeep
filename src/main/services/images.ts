import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { EntryCategory, EntryImage, VehicleGalleryImage } from '../../shared/types'
import { getDb, getImagesDir, nowIso } from '../db'

const MAX_IMAGES_PER_ENTRY = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

type ImageRow = {
  id: number
  entry_id: number
  file_name: string
  relative_path: string
  mime_type: string | null
  size_bytes: number | null
  caption: string | null
  created_at: string
}

function mapImage(row: ImageRow): EntryImage {
  return {
    id: row.id,
    entryId: row.entry_id,
    fileName: row.file_name,
    relativePath: row.relative_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    caption: row.caption,
    createdAt: row.created_at
  }
}

export function listImages(entryId: number): EntryImage[] {
  const rows = getDb()
    .prepare('SELECT * FROM entry_images WHERE entry_id = ? ORDER BY id ASC')
    .all(entryId) as ImageRow[]
  return rows.map(mapImage)
}

export function listVehicleImages(vehicleId: number): VehicleGalleryImage[] {
  const rows = getDb()
    .prepare(
      `SELECT
         i.*,
         e.title as entry_title,
         e.category as entry_category,
         e.performed_at as performed_at
       FROM entry_images i
       JOIN service_entries e ON e.id = i.entry_id
       WHERE e.vehicle_id = ?
         AND e.archived_at IS NULL
       ORDER BY e.performed_at DESC, i.id DESC`
    )
    .all(vehicleId) as Array<
    ImageRow & { entry_title: string; entry_category: EntryCategory; performed_at: string }
  >

  return rows.map((row) => ({
    ...mapImage(row),
    entryTitle: row.entry_title,
    entryCategory: row.entry_category,
    performedAt: row.performed_at
  }))
}

export function addImageFromPath(
  entryId: number,
  sourcePath: string,
  caption: string | null = null
): EntryImage {
  const count = getDb()
    .prepare('SELECT COUNT(*) as c FROM entry_images WHERE entry_id = ?')
    .get(entryId) as { c: number }

  if (count.c >= MAX_IMAGES_PER_ENTRY) {
    throw new Error(`Maximum ${MAX_IMAGES_PER_ENTRY} images per entry.`)
  }

  const stats = fs.statSync(sourcePath)
  if (stats.size > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds 5MB limit.')
  }

  const ext = path.extname(sourcePath) || '.jpg'
  const fileName = `${randomUUID()}${ext}`
  const relativePath = path.join(String(entryId), fileName)
  const destDir = path.join(getImagesDir(), String(entryId))
  const destPath = path.join(getImagesDir(), relativePath)

  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(sourcePath, destPath)

  const ts = nowIso()
  const result = getDb()
    .prepare(
      `INSERT INTO entry_images
        (entry_id, file_name, relative_path, mime_type, size_bytes, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(entryId, fileName, relativePath.replace(/\\/g, '/'), null, stats.size, caption, ts)

  const row = getDb()
    .prepare('SELECT * FROM entry_images WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as ImageRow

  return mapImage(row)
}

export function deleteImage(id: number): void {
  const row = getDb().prepare('SELECT * FROM entry_images WHERE id = ?').get(id) as
    | ImageRow
    | undefined
  if (!row) {
    return
  }

  const absolute = resolveImageAbsolutePath(row.relative_path)
  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute)
  }

  getDb().prepare('DELETE FROM entry_images WHERE id = ?').run(id)
}

export function updateImageCaption(id: number, caption: string | null): EntryImage {
  getDb().prepare('UPDATE entry_images SET caption = ? WHERE id = ?').run(caption, id)
  const row = getDb().prepare('SELECT * FROM entry_images WHERE id = ?').get(id) as ImageRow
  return mapImage(row)
}

export function resolveImageAbsolutePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/')
  return path.normalize(path.join(getImagesDir(), normalized))
}

function mimeFromExt(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'image/jpeg'
}

export function readImageAsDataUrl(relativePath: string): string {
  const absolute = resolveImageAbsolutePath(relativePath)
  if (!fs.existsSync(absolute)) {
    throw new Error(`Image not found: ${absolute}`)
  }
  const buffer = fs.readFileSync(absolute)
  return `data:${mimeFromExt(relativePath)};base64,${buffer.toString('base64')}`
}
