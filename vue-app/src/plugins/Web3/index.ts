import { LOGIN_MESSAGE, User } from '@/api/user'
import { sha256 } from '@/utils/crypto'
import { Web3Provider } from '@ethersproject/providers'
import MetamaskConnector from './connectors/MetamaskConnector'
import WalletConnectConnector from './connectors/WalletConnectConnector'

export type Wallet = 'metamask' | 'walletconnect'

const connectors: Record<Wallet, any> = {
  metamask: MetamaskConnector,
  walletconnect: WalletConnectConnector,
}

export default {
  install: async (Vue) => {
    const plugin = new Vue({
      data: {
        accounts: [],
        provider: null,
        chainId: null,
        // TODO: add `defaultProvider` in order to have everything web3 related
        // stuff here in this plugin
      },
    })

    plugin.connectWallet = async (
      wallet: Wallet
    ): Promise<User | undefined> => {
      try {
        if (!wallet || typeof wallet !== 'string') {
          throw new Error(
            'Please provide a wallet to facilitate a web3 connection.'
          )
        }

        const connector = connectors[wallet]

        if (!connector) {
          throw new Error(
            `Wallet [${wallet}] is not supported yet. Please contact the dev team to add this connector.`
          )
        }

        const conn = await connector.connect()
        const account = conn.accounts[0]
        plugin.chainId = Number(conn.chainId)
        plugin.provider = conn.provider

        conn.provider.on('accountsChanged', (newAccounts) => {
          plugin.accounts = newAccounts
          plugin.$emit('accountsChanged', plugin.accounts)
        })
        conn.provider.on('chainChanged', (newChainId) => {
          plugin.chainId = Number(newChainId)
          plugin.$emit('chainChanged', plugin.chainId)
        })
        // TODO?: conn.provider.on('disconnect', this.handleDisconnect)

        const signature = await conn.provider.request({
          method: 'personal_sign',
          params: [LOGIN_MESSAGE, account],
        })

        return {
          ...conn,
          // TODO: we are keeping most of these things for compatibility with
          // old code because we are storing them in vuex. Clean this up, do not
          // store them and read them directly from the plugin, `this.$web3`.
          // Separate the concept of User from here. Create the User when the
          // connection is made, from the consumer.
          encryptionKey: sha256(signature),
          isVerified: null,
          balance: null,
          contribution: null,
          walletProvider: new Web3Provider(conn.provider),
          walletAddress: account,
        }
      } catch (err) {
        /* eslint-disable-next-line no-console */
        console.error(err)
      }
    }

    plugin.disconnectWallet = async () => {
      // TODO
    }

    Object.defineProperty(Vue.prototype, '$web3', {
      get() {
        return plugin
      },
    })
  },
}
