import { ethers } from 'ethers'
import { mainnetProvider } from '@/api/core'

export function isSameAddress(address1: string, address2: string): boolean {
  return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
}

export async function ensLookup(address: string): Promise<string | null> {
  const ens = await mainnetProvider.lookupAddress(address)
  return ens
}

export async function isValidEns(name: string): Promise<boolean> {
  const address = await mainnetProvider.resolveName(name)
  return !!address
}

export async function resolveEns(name: string): Promise<string | null> {
  const address = await mainnetProvider.resolveName(name)
  return address
}
