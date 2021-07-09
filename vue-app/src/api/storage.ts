import { sha256, encrypt, decrypt } from '@/utils/crypto'
import { setValue, getValue, watch, unwatch } from './gun'

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
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  setValue(fullStorageKey, encryptedValue)
}

async function getItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string,
): Promise<string | null> {
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  const encryptedValue = await getValue(fullStorageKey)
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

function watchItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string,
  callback: (value: string | null) => any,
) {
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  watch(fullStorageKey, (encryptedValue) => {
    const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
    callback(value)
  })
}

function unwatchItem(
  accountId: string,
  storageKey: string,
): void {
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  unwatch(fullStorageKey)
}

export const storage = { setItem, getItem, watchItem, unwatchItem }
