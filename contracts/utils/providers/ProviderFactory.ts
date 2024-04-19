import { HardhatConfig } from 'hardhat/types'
import { BaseProvider } from './BaseProvider'
import { EtherscanProvider } from './EtherscanProvider'

export type CreateProviderArgs = {
  network: string
  config: HardhatConfig
}

export class ProviderFactory {
  static createProvider({ network, config }: CreateProviderArgs): BaseProvider {
    // use etherscan provider only as JsonRpcProvider is not reliable
    return new EtherscanProvider(config, network)
  }
}
