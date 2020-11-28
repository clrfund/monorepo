import { hexZeroPad } from '@ethersproject/bytes'

export function recipientAddressToId(address: string): string {
  return hexZeroPad(address.toLowerCase(), 32)
}
