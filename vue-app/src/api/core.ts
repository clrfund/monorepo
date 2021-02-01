import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'

export const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_API_URL,
)
export const blockExplorer = process.env.VUE_APP_BLOCK_EXPLORER
export const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
export const gunApiUrl = process.env.VUE_APP_GUN_API_URL as string

export const factory = new ethers.Contract(
  process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS as string,
  FundingRoundFactory,
  provider,
)
export const userRegistryType = process.env.VUE_APP_USER_REGISTRY_TYPE
if (!['simple', 'brightid'].includes(userRegistryType as string)) {
  throw new Error('invalid user registry type')
}
export const recipientRegistryType = process.env.VUE_APP_RECIPIENT_REGISTRY_TYPE
if (!['simple', 'kleros'].includes(recipientRegistryType as string)) {
  throw new Error('invalid recipient registry type')
}

export const extraRounds: string[] = process.env.VUE_APP_EXTRA_ROUNDS ?
  process.env.VUE_APP_EXTRA_ROUNDS.split(',') : []
