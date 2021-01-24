import { sha256, encrypt, decrypt } from '@/utils/crypto'

function getFullStorageKey(
  accountId: string,
  storageKey: string,
): string {
  accountId = accountId.toLowerCase()
  return sha256(`clrfund-${accountId}-${storageKey}`)
}

function setItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string,
  value: string,
): void {
  const encryptedValue = encrypt(value, encryptionKey)
  window.localStorage.setItem(
    getFullStorageKey(accountId, storageKey),
    encryptedValue,
  )
}

function getItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string,
): string | null {
  const encryptedValue = window.localStorage.getItem(
    getFullStorageKey(accountId, storageKey),
  )
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

export const storage = { setItem, getItem }
