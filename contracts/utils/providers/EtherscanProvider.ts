import { BaseProvider, FetchLogArgs, Log } from './BaseProvider'
import { FetchRequest } from 'ethers'

const EtherscanApiUrl: Record<string, string> = {
  xdai: 'https://api.gnosisscan.io',
  arbitrum: 'https://api.arbiscan.io',
  'arbitrum-goerli': 'https://api-goerli.arbiscan.io',
  'arbitrum-sepolia': 'https://api-sepolia.arbiscan.io',
  optimism: 'https://api-optimistic.etherscan.io',
  'optimism-sepolia': 'https://api-sepolia-optimistic.etherscan.io',
}

export class EtherscanProvider extends BaseProvider {
  apiKey: string
  network: string

  constructor(apiKey: string, network: string) {
    super()
    this.apiKey = apiKey
    this.network = network
  }

  async fetchLogs({
    filter,
    startBlock,
    lastBlock,
  }: FetchLogArgs): Promise<Log[]> {
    const baseUrl = EtherscanApiUrl[this.network]
    if (!baseUrl) {
      throw new Error(
        `Network ${this.network} is not supported in etherscan fetch log api`
      )
    }

    const topic0 = filter.topics?.[0] || ''
    const toBlockQuery = lastBlock ? `&toBlock=${lastBlock}` : ''
    const url =
      `${baseUrl}/api?module=logs&action=getLogs&address=${filter.address}` +
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
