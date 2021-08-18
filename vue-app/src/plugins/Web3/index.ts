import { LOGIN_MESSAGE } from '@/api/user'
import { sha256 } from '@/utils/crypto'
import { Web3Provider } from '@ethersproject/providers'
import WalletConnectProvider from '@walletconnect/web3-provider'
import MetamaskConnector from './connectors/MetamaskConnector'
import WalletConnectConnector from './connectors/WalletConnectConnector'
import { lsGet, lsSet, lsRemove } from '@/utils/connection'
import { CHAIN_INFO } from './constants/chains'

export type Wallet = 'metamask' | 'walletconnect'

const CONNECTED_PROVIDER = 'connected-provider'

const connectors: Record<Wallet, any> = {
  metamask: MetamaskConnector,
  walletconnect: WalletConnectConnector,
}

export default {
  install: async (Vue) => {
    const alreadyConnectedProvider: Wallet | null = lsGet(
      CONNECTED_PROVIDER,
      null
    )

    const plugin = new Vue({
      data: {
        accounts: [],
        provider: null,
        chainId: null,
        user: null,
        // TODO: add `defaultProvider` in order to have everything web3 related
        // encapsulated here in this plugin
      },
    })

    plugin.connectWallet = async (wallet: Wallet): Promise<void> => {
      if (!wallet || typeof wallet !== 'string') {
        throw new Error(
          'Please provide a wallet to facilitate a web3 connection.'
        )
      }

      const connector = connectors[wallet]

      if (!connector) {
        throw new Error(`Wallet [${wallet}] is not supported yet.`)
      }

      const conn = await connector.connect()
      const account = conn.accounts[0]

      const signature = await conn.provider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, account],
      })

      // Save chosen provider to localStorage
      lsSet(CONNECTED_PROVIDER, wallet)

      // Check if user is using the supported chain id
      const supportedChainId = Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)
      if (conn.chainId !== supportedChainId) {
        if (conn.provider instanceof WalletConnectProvider) {
          // Close walletconnect session
          await conn.provider.disconnect()
        }

        /* eslint-disable-next-line no-console */
        console.error(
          `Unsupported chain id: ${conn.chainId}. Supported chain id is: ${supportedChainId}`
        )
        throw new Error(
          `Wrong Network. Please connect to the ${CHAIN_INFO[supportedChainId].label} Ethereum network.`
        )
      }

      // Populate the plugin with the initial data
      plugin.accounts = conn.accounts
      plugin.provider = conn.provider
      plugin.chainId = conn.chainId
      plugin.user = {
        ...conn,
        // TODO: we are keeping most of these things for compatibility with
        // old code because we are storing them in vuex. Clean this up, do not
        // store them and read them directly from the plugin, `this.$web3`.
        // Separate the concept of User from here. Create the User when the
        // connection is made, from the consumer.
        encryptionKey: sha256(signature),
        balance: null,
        contribution: null,
        walletProvider: new Web3Provider(conn.provider),
        walletAddress: account,
      }

      // Emit EIP-1193 events and update plugin values
      conn.provider.on('accountsChanged', (newAccounts) => {
        plugin.accounts = newAccounts
        plugin.$emit('accountsChanged', plugin.accounts)
      })
      conn.provider.on('chainChanged', (newChainId) => {
        plugin.chainId = Number(newChainId)
        plugin.$emit('chainChanged', plugin.chainId)
      })
      conn.provider.on('disconnect', () => {
        plugin.disconnectWallet()
        plugin.$emit('disconnect')
      })
    }

    plugin.disconnectWallet = () => {
      plugin.accounts = []
      plugin.chainId = null
      lsRemove(CONNECTED_PROVIDER)
      if (plugin.provider?.disconnect) {
        plugin.provider.disconnect()
      }
      if (plugin.provider?.close) {
        plugin.provider.close()
      }

      plugin.provider = null
      plugin.user = null
    }

    // If previous provider was found, initiate connection.
    if (alreadyConnectedProvider) {
      const response = plugin.connectWallet(alreadyConnectedProvider)
      if (response.state !== 'fulfilled') {
        plugin.disconnectWallet()
      }
    }

    Object.defineProperty(Vue.prototype, '$web3', {
      get() {
        return plugin
      },
    })
  },
}
