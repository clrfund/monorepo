import { ethers } from 'ethers'
import { mainnetProvider } from '@/api/core'
import { isAddress } from '@ethersproject/address'

export function isSameAddress(address1: string, address2: string): boolean {
  return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
}

export async function ensLookup(address: string): Promise<string | null> {
  // Looks up possible ENS for given 0x address
  const name: string | null = await mainnetProvider.lookupAddress(address)
  return name
}

export async function resolveEns(name: string): Promise<string | null> {
  // Returns null if the name passed is a 0x address
  if (isAddress(name)) return null
  // If name is valid ENS returns 0x address, else returns null
  return await mainnetProvider.resolveName(name)
}

export async function isValidEthAddress(address: string): Promise<boolean> {
  // Returns true if address is valid ENS or 0x address
  const resolved = await mainnetProvider.resolveName(address)
  return !!resolved
}
