export const PHOTO_SLOTS = [
  {
    id: 'old_part',
    label: 'Old part / before',
    hint: 'How the worn or removed part looked'
  },
  {
    id: 'new_part',
    label: 'New part',
    hint: 'The replacement part before installation'
  },
  {
    id: 'installed',
    label: 'Installed / after',
    hint: 'Finished work — part in place'
  },
  {
    id: 'during_work',
    label: 'During work',
    hint: 'Mid-repair, disassembly, or comparison'
  },
  {
    id: 'receipt',
    label: 'Receipt / other',
    hint: 'Invoice, packaging, or extra reference'
  }
] as const

export type PhotoSlotId = (typeof PHOTO_SLOTS)[number]['id']

export function photoSlotCaption(slotId: PhotoSlotId): string {
  return PHOTO_SLOTS.find((slot) => slot.id === slotId)?.label ?? slotId
}

export function matchImageToSlot(
  caption: string | null,
  slotLabel: string
): boolean {
  if (!caption) return false
  return caption.toLowerCase() === slotLabel.toLowerCase()
}
