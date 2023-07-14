import WalletConnectProvider from '@walletconnect/web3-provider'
import { chainId as rpcChainId, rpcUrl } from '@/api/core'

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider = new WalletConnectProvider({
      infuraId: import.meta.env.VITE_INFURA_ID,
      rpc: {
        [rpcChainId]: rpcUrl,
      },
      bridge: "https://walletconnect-relay.minerva.digital",
    })

    let accounts, chainId
    try {
      accounts = await provider.enable()
      chainId = await provider.request({ method: 'eth_chainId' })
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
      chainId: Number(chainId),
    }
  },
}
