import WalletConnectProvider from '@walletconnect/web3-provider'

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider = new WalletConnectProvider({
      rpc: {
        1: process.env.VUE_APP_ETHEREUM_API_URL!,
      },
    })

    let accounts, chainId
    try {
      accounts = await provider.enable()
      chainId = await provider.request({ method: 'eth_chainId' })
    } catch (err) {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to WalletConnect.')
      } else {
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
