import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'

export const mainnetProvider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_MAINNET_API_URL
)
export const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_API_URL
)
export const blockExplorer =
  process.env.VUE_APP_BLOCK_EXPLORER || 'https://etherscan.io'
export const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
export const gunPeers: string[] = process.env.VUE_APP_GUN_PEERS
  ? process.env.VUE_APP_GUN_PEERS.split(',')
  : []

//TODO: need to be able to pass the factory contract address dynamically, note all places this is used make factory address a parameter that defaults to the env. variable set
//NOTE: these calls will be replaced by subgraph queries eventually.
export const factory = new ethers.Contract(
  process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS as string,
  FundingRoundFactory,
  provider
)
export const userRegistryType = process.env.VUE_APP_USER_REGISTRY_TYPE
export enum UserRegistryType {
  BRIGHT_ID = 'brightid',
  SIMPLE = 'simple',
}
if (
  ![UserRegistryType.BRIGHT_ID, UserRegistryType.SIMPLE].includes(
    userRegistryType as UserRegistryType
  )
) {
  throw new Error('invalid user registry type')
}
export const recipientRegistryType = process.env.VUE_APP_RECIPIENT_REGISTRY_TYPE
if (
  !['simple', 'optimistic', 'kleros'].includes(recipientRegistryType as string)
) {
  throw new Error('invalid recipient registry type')
}
export const recipientRegistryPolicy =
  process.env.VUE_APP_RECIPIENT_REGISTRY_POLICY
export const operator: string = process.env.VUE_APP_OPERATOR || 'Clr.fund team'
export const extraRounds: string[] = process.env.VUE_APP_EXTRA_ROUNDS
  ? process.env.VUE_APP_EXTRA_ROUNDS.split(',')
  : []

export const SUBGRAPH_ENDPOINT =
  process.env.VUE_APP_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/daodesigner/clrfund'
