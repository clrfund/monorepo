import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { chainId as rpcChainId, walletConnectProjectId, walletConnectZIndex } from '@/api/core'

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider = await EthereumProvider.init({
      projectId: walletConnectProjectId,
      chains: [rpcChainId],
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: { '--wcm-z-index': walletConnectZIndex },
        enableExplorer: true,
      },
    })

    const accounts = await provider.enable()
    const chainId = await provider.request({ method: 'eth_chainId' })

    return {
      provider,
      accounts,
      chainId: Number(chainId),
    }
  },
}
