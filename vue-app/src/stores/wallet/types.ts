import type { ExternalProvider } from '@ethersproject/providers'
import type WalletConnectProvider from '@walletconnect/web3-provider'

export interface Provider extends ExternalProvider {
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
