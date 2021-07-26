import WalletConnectProvider from '@walletconnect/web3-provider'
import { Web3Provider } from '@ethersproject/providers'
import { LOGIN_MESSAGE, User } from '@/api/user'
import { sha256 } from '@/utils/crypto'

export default {
  connect: async (): Promise<User | undefined> => {
    const provider = new WalletConnectProvider({
      rpc: {
        1: process.env.VUE_APP_ETHEREUM_API_URL!,
      },
    })

    let account
    try {
      ;[account] = await provider.enable()
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

    const user: User = {
      walletProvider: new Web3Provider(provider),
      walletAddress: account,
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }

    return user
  },
}
