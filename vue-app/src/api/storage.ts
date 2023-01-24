import { sha256, encrypt, decrypt } from '@/utils/crypto'
import { lsSet, lsGet } from '@/utils/localStorage'
import { utils } from 'ethers'

function getFullStorageKey(accountId: string, storageKey: string): string {
  accountId = accountId.toLowerCase()

  // remove substring(2) is to remove the leading 0x from the hash
  return sha256(
    utils.toUtf8Bytes(`clrfund-${accountId}-${storageKey}`)
  ).substring(2)
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

function getItem(
  accountId: string,
  encryptionKey: string,
  storageKey: string
): string | null {
  const fullStorageKey = getFullStorageKey(accountId, storageKey)
  const encryptedValue = lsGet(fullStorageKey)
  const value = encryptedValue ? decrypt(encryptedValue, encryptionKey) : null
  return value
}

export const storage = { setItem, getItem }
