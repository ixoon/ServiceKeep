import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getDb, getImagesDir, nowIso } from '../db'
import { getVehicle } from './vehicles'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function vehiclesPhotoDir(vehicleId: number): string {
  return path.join(getImagesDir(), 'vehicles', String(vehicleId))
}

function mimeFromExt(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'image/jpeg'
}

function resolvePhotoAbsolutePath(relativePath: string): string {
  const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
  return path.normalize(path.join(getImagesDir(), ...segments))
}

function deletePhotoFile(relativePath: string | null): void {
  if (!relativePath) return
  const absolute = resolvePhotoAbsolutePath(relativePath)
  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute)
  }
}

export function setVehiclePhotoFromPath(vehicleId: number, sourcePath: string): string {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }

  const stats = fs.statSync(sourcePath)
  if (stats.size > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds 5MB limit.')
  }

  deletePhotoFile(vehicle.photoPath)

  const ext = path.extname(sourcePath) || '.jpg'
  const fileName = `${randomUUID()}${ext}`
  const relativePath = path.join('vehicles', String(vehicleId), fileName).replace(/\\/g, '/')
  const destDir = vehiclesPhotoDir(vehicleId)
  const destPath = path.join(destDir, fileName)

  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(sourcePath, destPath)

  getDb()
    .prepare('UPDATE vehicles SET photo_path = ?, updated_at = ? WHERE id = ?')
    .run(relativePath, nowIso(), vehicleId)

  return relativePath
}

export function removeVehiclePhoto(vehicleId: number): void {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }

  deletePhotoFile(vehicle.photoPath)

  getDb()
    .prepare('UPDATE vehicles SET photo_path = NULL, updated_at = ? WHERE id = ?')
    .run(nowIso(), vehicleId)
}

export function readVehiclePhotoAsDataUrl(vehicleId: number): string | null {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle?.photoPath) {
    return null
  }

  const absolute = resolvePhotoAbsolutePath(vehicle.photoPath)
  if (!fs.existsSync(absolute)) {
    return null
  }

  const buffer = fs.readFileSync(absolute)
  return `data:${mimeFromExt(vehicle.photoPath)};base64,${buffer.toString('base64')}`
}
