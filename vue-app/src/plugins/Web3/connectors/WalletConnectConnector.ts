import WalletConnectProvider from '@walletconnect/web3-provider'
import { CHAIN_INFO } from '../constants/chains'

export default {
  // TODO: add better return type
  connect: async (chainId: number): Promise<any | undefined> => {
    const chain = CHAIN_INFO[chainId]
    if (!chain || !chain.rpcUrl) {
      throw new Error('Missing chain configuration for chainId ' + chainId)
    }

    const provider = new WalletConnectProvider({
      infuraId: process.env.VUE_APP_INFURA_ID,
      rpc: {
        [chainId]: chain.rpcUrl,
      },
    })

    let accounts, connectedChainId
    try {
      accounts = await provider.enable()
      connectedChainId = await provider.request({ method: 'eth_chainId' })
    } catch (err) {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        /* eslint-disable-next-line no-console */
        console.log('Please connect to WalletConnect.')
      } else {
        /* eslint-disable-next-line no-console */
        console.error(err)
        return
      }
    }

    return {
      provider,
      accounts,
      chainId: Number(connectedChainId),
    }
  },
}
