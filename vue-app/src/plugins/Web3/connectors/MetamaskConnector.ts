export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider =
      (window as any).ethereum ||
      ((window as any).web3 && (window as any).web3.currentProvider)

    if (!provider) {
      console.error(
        'Tried to connect to MetaMask but it was not detected. Please install MetaMask.'
      )
    }

    let accounts, chainId
    try {
      accounts = await provider.request({
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
    if (!accounts) {
      // have to any it, since enable technically shouldn't be there anymore.
      // but might, for legacy clients.
      const response = await (provider as any).enable()
      accounts = response?.result || response
    }

    return {
      provider,
      accounts,
      chainId: Number(chainId),
    }
  },
}
