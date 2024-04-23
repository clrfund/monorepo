export const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const UNIT = 10n ** 18n
export const VOICE_CREDIT_FACTOR = 10n ** BigInt(4 + 18 - 9)
export const ALPHA_PRECISION = 10n ** 18n
export const DEFAULT_SR_QUEUE_OPS = '4'
export const DEFAULT_GET_LOG_BATCH_SIZE = 20000
export const TREE_ARITY = 5

// brightid.clr.fund node uses this to sign messages
// see the ethSigningAddress in https://brightid.clr.fund
export const BRIGHTID_VERIFIER_ADDR =
  '0xdbf0b2ee9887fe11934789644096028ed3febe9c'

// This is brightid node signer address
// export const BRIGHTID_VERIFIER_ADDR = '0xb1d71F62bEe34E9Fc349234C201090c33BCdF6DB'

export enum RecipientState {
  Registered = 'Registered',
  Accepted = 'Accepted',
  Removed = 'Removed',
  Rejected = 'Rejected',
}
