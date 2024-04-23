import { BaseProvider, FetchLogArgs, Log } from './BaseProvider'
import { FetchRequest } from 'ethers'
import { HardhatConfig } from 'hardhat/types'

const EtherscanApiUrl: Record<string, string> = {
  xdai: 'https://api.gnosisscan.io',
  arbitrum: 'https://api.arbiscan.io',
  'arbitrum-goerli': 'https://api-goerli.arbiscan.io',
  'arbitrum-sepolia': 'https://api-sepolia.arbiscan.io',
  optimism: 'https://api-optimistic.etherscan.io',
  'optimism-sepolia': 'https://api-sepolia-optimistic.etherscan.io',
}

/**
 * Mapping of the hardhat network name to the Etherscan network name in the hardhat.config
 */
const EtherscanNetworks: Record<string, string> = {
  arbitrum: 'arbitrumOne',
  optimism: 'optimisticEthereum',
}

/**
 * The the Etherscan API key from the hardhat.config file
 * @param config The Hardhat config object
 * @param network The Hardhat network name
 * @returns The Etherscan API key
 */
function getEtherscanApiKey(config: HardhatConfig, network: string): string {
  let etherscanApiKey = ''
  if (config.etherscan?.apiKey) {
    if (typeof config.etherscan.apiKey === 'string') {
      etherscanApiKey = config.etherscan.apiKey
    } else {
      const etherscanNetwork = EtherscanNetworks[network] ?? network
      etherscanApiKey = config.etherscan.apiKey[etherscanNetwork]
    }
  }

  return etherscanApiKey
}

export class EtherscanProvider extends BaseProvider {
  apiKey: string
  network: string
  baseUrl: string

  constructor(config: HardhatConfig, network: string) {
    super()

    const etherscanApiKey = getEtherscanApiKey(config, network)
    if (!etherscanApiKey) {
      throw new Error(`Etherscan API key is not found for ${network}`)
    }

    const etherscanBaseUrl = EtherscanApiUrl[network]
    if (!etherscanBaseUrl) {
      throw new Error(
        `Network ${network} is not supported in etherscan fetch log api`
      )
    }

    this.network = network
    this.apiKey = etherscanApiKey
    this.baseUrl = etherscanBaseUrl
  }

  async fetchLogs({
    filter,
    startBlock,
    lastBlock,
  }: FetchLogArgs): Promise<Log[]> {
    const topic0 = filter.topics?.[0] || ''
    const toBlockQuery = lastBlock ? `&toBlock=${lastBlock}` : ''
    const url =
      `${this.baseUrl}/api?module=logs&action=getLogs&address=${filter.address}` +
      `&topic0=${topic0}&fromBlock=${startBlock}${toBlockQuery}&apikey=${this.apiKey}`

    const req = new FetchRequest(url)
    const resp = await req.send()
    const result = resp.bodyJson

    if (result.status === '0' && result.message === 'No records found') {
      return []
    }

    if (result.status !== '1') {
      throw new Error(JSON.stringify(result))
    }

    return result.result.map((res: any) => ({
      blockNumber: Number(res.blockNumber),
      blockHash: res.blockHash,
      transactionIndex: res.transactionIndex,
      removed: false,
      address: res.address,
      data: res.data,
      topics: res.topics,
      transactionHash: res.transactionHash,
      logIndex: res.logIndex === '0x' ? '0x00' : res.logIndex,
    }))
  }
}
