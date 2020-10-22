import { sha256, encrypt, decrypt } from '@/utils/crypto'

function getFullStorageKey(
  accountId: string,
  storageId: string,
  storageKey: string,
): string {
  storageId = storageId.toLowerCase()
  accountId = accountId.toLowerCase()
  return sha256(`clrfund-${storageId}-${accountId}-${storageKey}`)
}

function setItem(
  accountId: string,
  encryptionKey: string,
  storageId: string,
  storageKey: string,
  value: string,
): void {
  const encryptedValue = encrypt(value, encryptionKey)
  window.localStorage.setItem(
    getFullStorageKey(accountId, storageId, storageKey),
    encryptedValue,
  )
}

function getItem(
  accountId: string,
  encryptionKey: string,
  storageId: string,
  storageKey: string,
): string | null {
  const encryptedValue = window.localStorage.getItem(
    getFullStorageKey(accountId, storageId, storageKey),
  )
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

export const storage = { setItem, getItem }
