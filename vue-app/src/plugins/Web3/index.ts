import { User } from '@/api/user'
import MetamaskConnector from './connectors/MetamaskConnector'
import WalletConnectConnector from './connectors/WalletConnectConnector'

export type Wallet = 'metamask' | 'walletconnect'

const connectors: Record<Wallet, any> = {
  metamask: MetamaskConnector,
  walletconnect: WalletConnectConnector,
}

export default {
  install: async (Vue) => {
    const connectWallet = async (wallet: Wallet): Promise<User | undefined> => {
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

        return await connector.connect()
      } catch (err) {
        console.error(err)
      }
    }

    const disconnectWallet = async () => {
      // TODO
    }

    Object.defineProperty(Vue.prototype, '$web3', {
      get() {
        return {
          connectWallet,
          disconnectWallet,
        }
      },
    })
  },
}
