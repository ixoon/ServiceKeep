import type { IntervalOverride, IntervalOverrideMap } from './types'

export function parseIntervalOverrides(raw: string | null | undefined): IntervalOverrideMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const result: IntervalOverrideMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const row = value as IntervalOverride
      result[key] = {
        nextDueKmOffset:
          typeof row.nextDueKmOffset === 'number' && Number.isFinite(row.nextDueKmOffset)
            ? row.nextDueKmOffset
            : null,
        nextDueDays:
          typeof row.nextDueDays === 'number' && Number.isFinite(row.nextDueDays)
            ? row.nextDueDays
            : null
      }
    }
    return result
  } catch {
    return {}
  }
}

export function serializeIntervalOverrides(map: IntervalOverrideMap | null | undefined): string | null {
  if (!map) return null
  const cleaned: IntervalOverrideMap = {}
  for (const [key, value] of Object.entries(map)) {
    if (!value) continue
    const km = value.nextDueKmOffset
    const days = value.nextDueDays
    if (km == null && days == null) continue
    cleaned[key] = {
      nextDueKmOffset: km ?? null,
      nextDueDays: days ?? null
    }
  }
  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null
}
