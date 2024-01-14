export const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const UNIT = 10n ** 18n
export const VOICE_CREDIT_FACTOR = 10n ** BigInt(4 + 18 - 9)
export const ALPHA_PRECISION = 10n ** 18n
export const DEFAULT_SR_QUEUE_OPS = '4'

export enum RecipientState {
  Registered = 'Registered',
  Accepted = 'Accepted',
  Removed = 'Removed',
  Rejected = 'Rejected',
}
