import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'
import { CoinbaseWalletConnector, MetaMaskConnector, WalletConnectConnector } from 'vue-dapp'

export const rpcUrl = import.meta.env.VITE_ETHEREUM_API_URL
if (!rpcUrl) {
	throw new Error('Please provide ethereum rpc url for connecting to blockchain')
}

export const mainnetProvider = new ethers.providers.StaticJsonRpcProvider(import.meta.env.VITE_ETHEREUM_MAINNET_API_URL)
export const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl)
export const chain = CHAIN_INFO[Number(import.meta.env.VITE_ETHEREUM_API_CHAINID)]
if (!chain) throw new Error('invalid chain id')
export const ipfsGatewayUrl = import.meta.env.VITE_IPFS_GATEWAY_URL
export const gunPeers: string[] = import.meta.env.VITE_GUN_PEERS ? import.meta.env.VITE_GUN_PEERS.split(',') : []

export const ipfsPinningUrl = import.meta.env.VITE_IPFS_PINNING_URL
if (!ipfsPinningUrl) throw new Error('invalid ipfs pinning url')
export const ipfsPinningJwt = import.meta.env.VITE_IPFS_PINNING_JWT
export const ipfsApiKey = import.meta.env.VITE_IPFS_API_KEY
export const ipfsSecretApiKey = import.meta.env.VITE_IPFS_SECRET_API_KEY
if (!ipfsPinningJwt && !(ipfsApiKey && ipfsSecretApiKey)) {
	throw new Error(
		'Please setup environment variables for ' +
			'VUE_APP_IPFS_API_KEY and VUE_APP_IPFS_SECRET_API_KEY or VUE_APP_IPFS_PINNING_JWT',
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
export const extraRounds: string[] = import.meta.env.VITE_EXTRA_ROUNDS
	? import.meta.env.VITE_EXTRA_ROUNDS.split(',')
	: []

export const SUBGRAPH_ENDPOINT =
	import.meta.env.VITE_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/clrfund/clrfund'

// application theme
export enum ThemeMode {
	LIGHT = 'light',
	DARK = 'dark',
}

// vue-dapp
export const connectors = [
	new MetaMaskConnector(),
	new WalletConnectConnector({
		qrcode: true,
		rpc: {
			31337: rpcUrl,
		},
	}),
	new CoinbaseWalletConnector({
		appName: 'Clr.fund',
		jsonRpcUrl: rpcUrl,
	}),
]
