import { ThemeMode } from '@/api/core'

export function getOsColorScheme(): ThemeMode {
  const colorScheme = ThemeMode.DARK
  return colorScheme
}

export function isValidTheme(scheme: string): boolean {
  return Object.values(ThemeMode).includes(scheme as ThemeMode)
}
