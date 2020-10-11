import { encrypt, decrypt } from '@/utils/crypto'
import { factory } from './core'

const storageKeyPrefix = `clrfund-${factory.address.toLowerCase().slice(2, 6)}-`

function setItem(
  storageKey: string,
  encryptionKey: string,
  value: string,
): void {
  const encryptedValue = encrypt(value, encryptionKey)
  window.localStorage.setItem(`${storageKeyPrefix}${storageKey}`, encryptedValue)
}

function getItem(
  storageKey: string,
  encryptionKey: string,
): string | null {
  const encryptedValue = window.localStorage.getItem(`${storageKeyPrefix}${storageKey}`)
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

export const storage = { setItem, getItem }
