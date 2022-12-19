import { providers } from 'ethers'
import { BaseProvider } from './BaseProvider'
import { EtherscanProvider } from './EtherscanProvider'
import { JsonRpcProvider } from './JsonRpcProvider'

export type CreateProviderArgs = {
  provider: providers.Provider
  network: string
  etherscanApiKey?: string
}

export class ProviderFactory {
  static createProvider({
    network,
    etherscanApiKey,
    provider,
  }: CreateProviderArgs): BaseProvider {
    return etherscanApiKey
      ? new EtherscanProvider(etherscanApiKey, network)
      : new JsonRpcProvider(provider)
  }
}
