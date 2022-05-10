import { ThemeMode } from '@/api/core'

const PREFER_COLOR_SCHEME = '(prefers-color-scheme: dark)'

export function getOsColorScheme(): ThemeMode {
  const { matches } = window.matchMedia(PREFER_COLOR_SCHEME)
  const colorScheme = matches ? ThemeMode.DARK : ThemeMode.LIGHT
  return colorScheme
}

export function isValidTheme(scheme: string): boolean {
  return Object.values(ThemeMode).includes(scheme as ThemeMode)
}
