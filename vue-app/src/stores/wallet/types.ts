import type { Eip1193Provider } from 'ethers'
import type WalletConnectProvider from '@walletconnect/web3-provider'

export interface Provider extends Eip1193Provider {
  disconnect?: () => void
  close?: () => void
  removeListener?: (event: string, handler: () => void) => void
}

export interface ConnectorInfo {
  accounts: Array<string>
  chainId: number
  provider: Provider | WalletConnectProvider
}

export interface Connector {
  connect: () => Promise<ConnectorInfo | undefined>
}
