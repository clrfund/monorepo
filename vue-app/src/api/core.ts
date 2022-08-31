import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'

export const mainnetProvider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_MAINNET_API_URL
)
export const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_API_URL
)
export const chain =
  CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)]
if (!chain) throw new Error('invalid chain id')
export const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
export const gunPeers: string[] = process.env.VUE_APP_GUN_PEERS
  ? process.env.VUE_APP_GUN_PEERS.split(',')
  : []

export const ipfsPinningUrl = process.env.VUE_APP_IPFS_PINNING_URL
if (!ipfsPinningUrl) throw new Error('invalid ipfs pinning url')
export const ipfsPinningJwt = process.env.VUE_APP_IPFS_PINNING_JWT
if (!ipfsPinningJwt) throw new Error('invalid ipfs pinning JWT')

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
export enum RecipientRegistryType {
  SIMPLE = 'simple',
  OPTIMISTIC = 'optimistic',
  KLEROS = 'kleros',
}
export const recipientRegistryType =
  process.env.VUE_APP_RECIPIENT_REGISTRY_TYPE || ''
if (
  !Object.values(RecipientRegistryType).includes(
    recipientRegistryType as RecipientRegistryType
  )
) {
  throw new Error('invalid recipient registry type')
}
export const recipientRegistryPolicy =
  process.env.VUE_APP_RECIPIENT_REGISTRY_POLICY
export const operator: string = process.env.VUE_APP_OPERATOR || 'Clr.fund'
export const extraRounds: string[] = process.env.VUE_APP_EXTRA_ROUNDS
  ? process.env.VUE_APP_EXTRA_ROUNDS.split(',')
  : []

export const SUBGRAPH_ENDPOINT =
  process.env.VUE_APP_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/clrfund/clrfund'

export const METADATA_SUBGRAPH_URL_PREFIX = process.env
  .VUE_APP_METADATA_SUBGRAPH_URL_PREFIX
  ? process.env.VUE_APP_METADATA_SUBGRAPH_URL_PREFIX
  : 'https://api.thegraph.com/subgraphs/name/yuetloo/metadata-'

export const METADATA_NETWORKS = process.env.VUE_APP_METADATA_NETWORKS
  ? process.env.VUE_APP_METADATA_NETWORKS.split(',')
  : ['rinkeby']

export const QUERY_BATCH_SIZE =
  Number(process.env.VUE_APP_QUERY_BATCH_SIZE) || 30

export const MAX_RETRIES = Number(process.env.VUE_APP_MAX_RETRIES) || 10

// application theme
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

// transaction progress reported as the current block seen
// and the last block the transaction is expected to be in
export type TransactionProgress = {
  current: number
  last: number
}
