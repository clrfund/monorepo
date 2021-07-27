import { ethers } from 'ethers'

export function isSameAddress(address1: string, address2: string): boolean {
  return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2)
}
