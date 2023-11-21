import { BigNumber } from 'ethers'

export const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const UNIT = BigNumber.from(10).pow(BigNumber.from(18))
export const VOICE_CREDIT_FACTOR = BigNumber.from(10).pow(4 + 18 - 9)
export const ALPHA_PRECISION = BigNumber.from(10).pow(18)
export const DEFAULT_SR_QUEUE_OPS = 4

export enum RecipientState {
  Registered = 'Registered',
  Accepted = 'Accepted',
  Removed = 'Removed',
  Rejected = 'Rejected',
}
