import { BaseProvider } from './BaseProvider'
import { EtherscanProvider } from './EtherscanProvider'

export type CreateProviderArgs = {
  network: string
  etherscanApiKey: string
}

export class ProviderFactory {
  static createProvider({
    network,
    etherscanApiKey,
  }: CreateProviderArgs): BaseProvider {
    // use etherscan provider only as JsonRpcProvider is not reliable
    return new EtherscanProvider(etherscanApiKey, network)
  }
}
