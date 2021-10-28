import { CHAIN_INFO } from '../constants/chains'

async function setupNetwork(provider): Promise<void> {
  const chainId = parseInt(process.env.VUE_APP_ETHEREUM_API_CHAINID || '1', 10)
  const hexChainId = `0x${chainId.toString(16)}`

  // Recommended usage of these methods
  // https://docs.metamask.io/guide/rpc-api.html#usage-with-wallet-switchethereumchain
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: hexChainId,
        },
      ],
    })
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (error.code === 4902 && CHAIN_INFO[chainId].rpcUrl) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: CHAIN_INFO[chainId].label,
              nativeCurrency: {
                name: 'ETH',
                symbol: 'eth',
                decimals: 18,
              },
              rpcUrls: [CHAIN_INFO[chainId].rpcUrl],
              blockExplorerUrls: [CHAIN_INFO[chainId].explorer],
            },
          ],
        })
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to add network information to wallet.')
      }
    }
  }
}

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider =
      (window as any).ethereum ||
      ((window as any).web3 && (window as any).web3.currentProvider)

    if (!provider) {
      /* eslint-disable-next-line no-console */
      console.error(
        'Tried to connect to MetaMask but it was not detected. Please install MetaMask.'
      )
    }

    // Prompt the user to add or switch to our supported network
    await setupNetwork(provider)

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
        /* eslint-disable-next-line no-console */
        console.log('Please connect to MetaMask.')
      } else {
        /* eslint-disable-next-line no-console */
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
