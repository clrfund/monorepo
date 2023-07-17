import { defineStore } from 'pinia'
import MetamaskConnector from './connectors/MetamaskConnector'
import WalletConnectConnector from './connectors/WalletConnectConnector'
import { lsGet, lsSet, lsRemove } from '@/utils/localStorage'
import { CHAIN_INFO } from '@/utils/chains'
import type { Provider } from './types'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { chainId } from '@/api/core'
import { providers } from 'ethers'

const CONNECTED_PROVIDER = 'connected-provider'
const DISCONNECT_EVENT = 'disconnect'
const ACCOUNTS_CHANGED_EVENT = 'accountsChanged'
const CHAIN_CHANGED_EVENT = 'chainChanged'

export type WalletProvider = 'metamask' | 'walletconnect'

const connectors: Record<WalletProvider, any> = {
  metamask: MetamaskConnector,
  walletconnect: WalletConnectConnector,
}

export type WalletUser = {
  chainId: number
  web3Provider: providers.Web3Provider
  walletAddress: string
}

export type WalletState = {
  user: WalletUser | null
  provider: Provider | null
  chainId: number | null
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    user: null,
    provider: null,
    chainId: null,
  }),
  getters: {},
  actions: {
    /**
     * reconnect to the wallet using previously connected provider
     */
    async reconnect(): Promise<void> {
      const alreadyConnectedProvider: WalletProvider | null = lsGet(CONNECTED_PROVIDER, null)
      if (alreadyConnectedProvider) {
        lsRemove(CONNECTED_PROVIDER)
        await this.connect(alreadyConnectedProvider)
      }
    },

    /**
     * Connect to a wallet
     * @param walletProvider which wallet to connect with
     */
    async connect(walletProvider?: WalletProvider): Promise<void> {
      if (!walletProvider || typeof walletProvider !== 'string') {
        throw new Error('Please provide a wallet to facilitate a web3 connection.')
      }

      const connector = connectors[walletProvider]

      if (!connector) {
        throw new Error(`Wallet [${walletProvider}] is not supported yet.`)
      }

      const conn = await connector.connect()
      if (!conn) {
        throw new Error('Error encountered while connecting to the wallet')
      }

      const account = conn.accounts[0]

      // Save chosen provider to localStorage
      lsSet(CONNECTED_PROVIDER, walletProvider)

      // Check if user is using the supported chain id
      const supportedChainId = chainId
      if (conn.chainId !== supportedChainId) {
        if (conn.provider instanceof EthereumProvider) {
          // Close walletconnect session
          await conn.provider.disconnect()
        }

        /* eslint-disable-next-line no-console */
        console.error(`Unsupported chain id: ${conn.chainId}. Supported chain id is: ${supportedChainId}`)
        throw new Error(`Wrong Network. Please connect to the ${CHAIN_INFO[supportedChainId].label} Ethereum network.`)
      }

      // Populate the state with the initial data
      this.chainId = conn.chainId
      this.provider = markRaw(conn.provider)
      this.user = {
        chainId: conn.chainId,
        walletAddress: account,
        web3Provider: markRaw(new providers.Web3Provider(conn.provider)),
      }

      // Emit EIP-1193 events and update plugin values
      conn.provider.on(ACCOUNTS_CHANGED_EVENT, this.disconnect)
      conn.provider.on(CHAIN_CHANGED_EVENT, this.disconnect)
      conn.provider.on(DISCONNECT_EVENT, this.disconnect)
    },

    /**
     * Disconnect wallet
     */
    async disconnect() {
      lsRemove(CONNECTED_PROVIDER)
      if (this.provider?.disconnect) {
        this.provider.disconnect()
      }
      if (this.provider?.close) {
        this.provider.close()
      }

      if (this.provider?.removeListener) {
        this.provider.removeListener(ACCOUNTS_CHANGED_EVENT, this.disconnect)
        this.provider.removeListener(CHAIN_CHANGED_EVENT, this.disconnect)
        this.provider.removeListener(DISCONNECT_EVENT, this.disconnect)
      }

      this.provider = null
      this.user = null
      this.chainId = null
    },
  },
})
