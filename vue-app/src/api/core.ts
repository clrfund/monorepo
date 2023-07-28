import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'
import { CHAIN_INFO } from '@/utils/chains'

import historicalRounds from '@/rounds/rounds.json'
import { DateTime } from 'luxon'

export const rpcUrl = import.meta.env.VITE_ETHEREUM_API_URL
if (!rpcUrl) {
  throw new Error('Please provide ethereum rpc url for connecting to blockchain')
}

export const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID
if (!walletConnectProjectId) {
  throw new Error('Please provide wallet connect project id')
}

export const mainnetProvider = new ethers.providers.StaticJsonRpcProvider(import.meta.env.VITE_ETHEREUM_MAINNET_API_URL)
export const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl)
export const chainId = Number(import.meta.env.VITE_ETHEREUM_API_CHAINID)
export const chain = CHAIN_INFO[chainId]
if (!chain) throw new Error('invalid chain id')
export const ipfsGatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL

export const ipfsPinningUrl = import.meta.env.VITE_IPFS_PINNING_URL
if (!ipfsPinningUrl) throw new Error('invalid ipfs pinning url')
export const ipfsPinningJwt = import.meta.env.VITE_IPFS_PINNING_JWT
export const ipfsApiKey = import.meta.env.VITE_IPFS_API_KEY
export const ipfsSecretApiKey = import.meta.env.VITE_IPFS_SECRET_API_KEY
if (!ipfsPinningJwt && !(ipfsApiKey && ipfsSecretApiKey)) {
  throw new Error(
    'Please setup environment variables for ' +
      'VITE_IPFS_API_KEY and VITE_IPFS_SECRET_API_KEY or VITE_IPFS_PINNING_JWT',
  )
}

//TODO: need to be able to pass the factory contract address dynamically, note all places this is used make factory address a parameter that defaults to the env. variable set
//NOTE: these calls will be replaced by subgraph queries eventually.
export const factory = new ethers.Contract(
  import.meta.env.VITE_CLRFUND_FACTORY_ADDRESS as string,
  FundingRoundFactory,
  provider,
)
export const userRegistryType = import.meta.env.VITE_USER_REGISTRY_TYPE
export enum UserRegistryType {
  BRIGHT_ID = 'brightid',
  SIMPLE = 'simple',
}
if (![UserRegistryType.BRIGHT_ID, UserRegistryType.SIMPLE].includes(userRegistryType as UserRegistryType)) {
  throw new Error('invalid user registry type')
}
export const recipientRegistryType = import.meta.env.VITE_RECIPIENT_REGISTRY_TYPE
if (!['simple', 'optimistic', 'kleros'].includes(recipientRegistryType as string)) {
  throw new Error('invalid recipient registry type')
}
export const recipientRegistryPolicy = import.meta.env.VITE_RECIPIENT_REGISTRY_POLICY
export const operator: string = import.meta.env.VITE_OPERATOR || 'Clr.fund'

export const SUBGRAPH_ENDPOINT =
  import.meta.env.VITE_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/clrfund/clrfund'

// application theme
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

// the maximum significant digits for displaying the contribution amount on cart
export const maxDecimals = Number(import.meta.env.VUE_APP_MAX_DECIMAL || 1)

// the number of records per batch in the `pending submissions` export file
export const exportBatchSize = Number(import.meta.env.VITE_EXPORT_BATCH_SIZE) || 60

// BrightId sponsorhip stuff, set these parameters to automatically sponsor user using the brightId URL
export const brightIdSponsorKey = import.meta.env.VITE_BRIGHTID_SPONSOR_KEY
export const brightIdNodeUrl = import.meta.env.VITE_BRIGHTID_NODE_URL || 'https://brightid.clr.fund/brightid/v6'
export const brightIdSponsorUrl = import.meta.env.VITE_BRIGHTID_SPONSOR_API_URL

// wait for data to sync with the subgraph
export const MAX_WAIT_DEPTH = Number(import.meta.env.VITE_MAX_WAIT_DEPTH) || 15

export type LeaderboardRound = {
  address: string
  network: string
}

const leaderboardRounds = historicalRounds as LeaderboardRound[]
export { leaderboardRounds }

export const showComplianceRequirement = /^yes$/i.test(import.meta.env.VITE_SHOW_COMPLIANCE_REQUIREMENT)

export const isBrightIdRequired = userRegistryType === 'brightid'
export const isOptimisticRecipientRegistry = recipientRegistryType === 'optimistic'

// Try to get the next scheduled start date
const nextStartDate = import.meta.env.VITE_NEXT_ROUND_START_DATE
  ? DateTime.fromFormat(import.meta.env.VITE_NEXT_ROUND_START_DATE, 'yyyy-MM-dd')
  : null

export const nextRoundStartDate = nextStartDate?.isValid ? nextStartDate : null

// Use this deadline to hide the 'Add Project' button
const deadline = import.meta.env.VITE_RECIPIENT_JOIN_DEADLINE
  ? DateTime.fromFormat(import.meta.env.VITE_RECIPIENT_JOIN_DEADLINE, 'yyyy-MM-dd', { zone: 'utc' })
  : null
export const recipientJoinDeadlineConfig = deadline?.isValid ? deadline : null

// make sure walletconnect qrcode modal is not blocked by the Wallet Modal
export const walletConnectZIndex = import.meta.env.VITE_WALLET_CONNECT_Z_INDEX || '1500'

// use this to filter out rounds that should not be displayed on the app
export const voidedRounds = new Set(
  (import.meta.env.VITE_VOIDED_ROUNDS || '').split(',').map(round => round.toLowerCase()),
)
