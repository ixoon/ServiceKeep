import type { ThemeMode } from '../../../shared/types'

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
