import WalletConnectProvider from '@walletconnect/web3-provider'
import { Web3Provider } from '@ethersproject/providers'
import { LOGIN_MESSAGE, User } from '@/api/user'
import { sha256 } from '@/utils/crypto'

export default {
  connect: async (): Promise<User> => {
    const provider = new WalletConnectProvider({
      // rpc: {
      //   [configService.env.NETWORK]: configService.network.rpc,
      // },
      infuraId: '4299898b85054e0386e7136ab3170d11',
      rpc: {
        // 1: "http://localhost:18545",
        3: 'https://rinkeby.infura.io/v3/',
      },
      // chainId: 1
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
      }
    }

    let signature
    try {
      signature = await provider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, account],
      })
    } catch (error) {
      // TODO
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
