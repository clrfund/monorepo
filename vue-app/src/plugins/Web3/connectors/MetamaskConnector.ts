import { LOGIN_MESSAGE } from '@/api/user'
import { sha256 } from '@/utils/crypto'

export default {
  connect: async (): Promise<any | undefined> => {
    const provider =
      (window as any).ethereum ||
      ((window as any).web3 && (window as any).web3.currentProvider)

    if (!provider) {
      console.error(
        'Tried to connect to MetaMask but it was not detected. Please install MetaMask.'
      )
    }

    let account, chainId
    try {
      ;[account] = await provider.request({
        method: 'eth_requestAccounts',
      })
      chainId = await provider.request({ method: 'eth_chainId' })
    } catch (err) {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.')
      } else {
        console.error(err)
        return
      }
    }

    // if account is still moot, try the bad old way - enable()
    if (!account) {
      // have to any it, since enable technically shouldn't be there anymore.
      // but might, for legacy clients.
      const response = await (provider as any).enable()
      ;[account] = response?.result || response
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
