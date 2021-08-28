import { ethers } from 'ethers'
import { mainnetProvider } from '@/api/core'

export function isSameAddress(address1: string, address2: string): boolean {
  return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
}

export async function ensLookup(address: string): Promise<string | null> {
  const ens = await mainnetProvider.lookupAddress(address)
  return ens
}
