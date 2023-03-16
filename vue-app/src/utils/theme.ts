import { ThemeMode } from '@/api/core'

const PREFER_COLOR_SCHEME = '(prefers-color-scheme: dark)'

export function getDefaultColorScheme(): ThemeMode {
  const colorScheme = ThemeMode.DARK
  return colorScheme
}

export function isValidTheme(scheme: string): boolean {
  return Object.values(ThemeMode).includes(scheme as ThemeMode)
}
