import WalletConnectProvider from '@walletconnect/web3-provider'
import { LOGIN_MESSAGE } from '@/api/user'
import { sha256 } from '@/utils/crypto'

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider = new WalletConnectProvider({
      rpc: {
        1: process.env.VUE_APP_ETHEREUM_API_URL!,
      },
    })

    let account, chainId
    try {
      ;[account] = await provider.enable()
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

    let signature
    try {
      signature = await provider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, account],
      })
    } catch (err) {
      console.error(err)
      return
    }

    return {
      provider,
      account,
      chainId,
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }
  },
}
