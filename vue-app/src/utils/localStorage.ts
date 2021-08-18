import pkg from '@/../package.json'

function lsGetKey(key: string) {
  return `${pkg.name}.${key}`
}

export function lsSet(key: string, value: any) {
  return localStorage.setItem(lsGetKey(key), JSON.stringify(value))
}

export function lsGet<T = any>(key: string, defaultValue: any = null): T {
  const rawValue = localStorage.getItem(lsGetKey(key))
  if (rawValue != null) {
    try {
      const value = JSON.parse(rawValue)
      return value
    } catch (e) {
      return defaultValue
    }
  }
  return defaultValue
}

export function lsRemove(key: string) {
  return localStorage.removeItem(lsGetKey(key))
}
