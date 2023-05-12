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
        themeVariables: { '--w3m-z-index': walletConnectZIndex },
        chainImages: undefined,
        desktopWallets: undefined,
        walletImages: undefined,
        mobileWallets: undefined,
        enableExplorer: true,
        explorerAllowList: undefined,
        tokenImages: undefined,
        privacyPolicyUrl: undefined,
        explorerDenyList: undefined,
        termsOfServiceUrl: undefined,
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
