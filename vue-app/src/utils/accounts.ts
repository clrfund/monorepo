import { ethers } from 'ethers'
import { mainnetProvider } from '@/api/core'
import { isAddress } from '@ethersproject/address'
import { Credential } from '@/api/passkey'
import { findKeyPair } from '@/api/keypair'
import { Keypair } from '@clrfund/maci-utils'
import { sha256, decrypt } from './crypto'
import { storage } from '@/api/storage'
import { getCartStorageKey, hasContributorVoted } from '@/api/contributions'

export class WrongKeyError extends Error {
  constructor(message?: string) {
    super(message)
    // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-388605613
    Object.setPrototypeOf(this, WrongKeyError.prototype)
  }
}

export function isSameAddress(address1: string, address2: string): boolean {
  // check for empty address to avoid getAddress() from throwing
  return (
    !!address1 &&
    !!address2 &&
    ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
  )
}

// Looks up possible ENS for given 0x address
export async function ensLookup(address: string): Promise<string | null> {
  const name: string | null = await mainnetProvider.lookupAddress(address)
  return name
}

// Returns null if the name passed is a 0x address
// If name is valid ENS returns 0x address, else returns null
export async function resolveEns(name: string): Promise<string | null> {
  if (isAddress(name)) return null
  return await mainnetProvider.resolveName(name)
}

// Returns true if address is valid ENS or 0x address
export async function isValidEthAddress(address: string): Promise<boolean> {
  const resolved = await mainnetProvider.resolveName(address)
  return !!resolved
}

export function renderAddressOrHash(
  address: string,
  digitsToShow?: number
): string {
  if (digitsToShow) {
    const beginDigits: number = Math.ceil(digitsToShow / 2)
    const endDigits: number = Math.floor(digitsToShow / 2)
    const begin: string = address.substr(0, 2 + beginDigits)
    const end: string = address.substr(address.length - endDigits, endDigits)
    return `${begin}…${end}`
  }
  return address
}

async function findEncryptionKey(
  keys: string[],
  findFn: (key: string) => Promise<boolean>
): Promise<string> {
  for (const currentKey of keys) {
    const hashedKey = sha256(currentKey)
    const found = await findFn(hashedKey)
    if (found) {
      return hashedKey
    }
  }

  throw new WrongKeyError()
}

/**
 * Return the encryption key if found, otherwise create a new one
 * @param address
 * @param fundingRoundAddress
 * @returns encryption key
 */
export async function createOrGetEncryptionKey(
  address: string,
  fundingRoundAddress: string
): Promise<string> {
  const credential = new Credential(address)

  const key = await getEncryptionKey(address, fundingRoundAddress)

  if (key) {
    return key
  } else {
    const key = await credential.create()
    const hashed = sha256(key)
    return hashed
  }
}

/**
 * Check MACI encrypted messages and the encrypted uncommited cart to see
 * which public key recovered from the passkey signature was used for the
 * encryption and return the sha256 hash of the key as the encryption key
 *
 * @param address user wallet address
 * @returns encryption key
 */
export async function getEncryptionKey(
  address: string,
  fundingRoundAddress: string
): Promise<string> {
  if (!fundingRoundAddress) {
    return ''
  }
  const hasVoted = await hasContributorVoted(fundingRoundAddress, address)
  const uncommitedCart = storage.getItemRaw(
    address,
    getCartStorageKey(fundingRoundAddress)
  )

  if (!hasVoted && !uncommitedCart) {
    return ''
  }

  const credential = new Credential(address)
  const keys = await credential.get()

  /* first look for the key used to encrypt MACI messages */
  if (hasVoted) {
    return findEncryptionKey(keys, async (key) => {
      const keypair = Keypair.createFromSeed(key)
      return findKeyPair({
        fundingRoundAddress,
        keypair,
      })
    })
  }

  /* now check if the key was used to encrypt uncommitted cart  */
  if (uncommitedCart) {
    return findEncryptionKey(keys, (key) => {
      try {
        return Promise.resolve(Boolean(decrypt(uncommitedCart, key)))
      } catch (err) {
        // ignore error
        return Promise.resolve(false)
      }
    })
  }

  return ''
}

/**
 * Return the first key from the credential as the encryption key
 * @param address wallet address
 * @returns encryption key
 */
export async function getFirstEncryptionKey(address: string): Promise<string> {
  const credential = new Credential(address)
  const keys = await credential.get()

  const hashed = sha256(keys[0])
  return hashed
}
