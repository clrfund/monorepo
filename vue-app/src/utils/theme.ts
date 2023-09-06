import { ThemeMode } from '@/api/core'

export function getDefaultColorScheme(): ThemeMode {
  const colorScheme = ThemeMode.LIGHT
  return colorScheme
}

export function isValidTheme(scheme: string): boolean {
  return Object.values(ThemeMode).includes(scheme as ThemeMode)
}
