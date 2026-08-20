export function confirmPermanentDelete(itemLabel: string, extraWarning?: string): boolean {
  const message = extraWarning
    ? `Permanently delete ${itemLabel}?\n\n${extraWarning}\n\nThis cannot be undone.`
    : `Permanently delete ${itemLabel}? This cannot be undone.`
  return confirm(message)
}
