import { User } from '@/api/user'
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
        // TODO: add default provider
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

        return {
          ...conn,
          // TODO: `walletProvider` and `walletAddress` should be removed. We
          // are only keeping them for compatibility with old code. In short,
          // we shouldn't be storing in the $store the entire provider.
          walletProvider: new Web3Provider(conn.provider),
          walletAddress: conn.account,
        }
      } catch (err) {
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
