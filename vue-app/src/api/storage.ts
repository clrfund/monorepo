import { sha256, encrypt, decrypt } from '@/utils/crypto'
import { lsSet, lsGet } from '@/utils/localStorage'

function getFullStorageKey(accountId: string, storageKey: string): string {
  accountId = accountId.toLowerCase()
  return sha256(`clrfund-${accountId}-${storageKey}`)
}

function setItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string,
  value: string
): void {
  const encryptedValue = encrypt(value, encryptionKey)
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  lsSet(fullStorageKey, encryptedValue)
}

async function getItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string
): Promise<string | null> {
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  const encryptedValue = await lsGet(fullStorageKey)
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

export const storage = { setItem, getItem }
