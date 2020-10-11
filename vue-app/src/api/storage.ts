import { factory } from './core'

const storageKeyPrefix = `clrfund-${factory.address.toLowerCase().slice(2, 6)}-`

function setItem(
  storageKey: string,
  value: string,
): void {
  window.localStorage.setItem(`${storageKeyPrefix}${storageKey}`, value)
}

function getItem(
  storageKey: string,
): string | null {
  return window.localStorage.getItem(`${storageKeyPrefix}${storageKey}`)
}

export const storage = { setItem, getItem }
