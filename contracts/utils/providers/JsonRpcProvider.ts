import { BaseProvider, FetchLogArgs, Log } from './BaseProvider'
import { providers } from 'ethers'

export class JsonRpcProvider extends BaseProvider {
  provider: providers.Provider

  constructor(provider: providers.Provider) {
    super()
    this.provider = provider
  }

  async fetchLogs({
    filter,
    startBlock,
    lastBlock,
    blocksPerBatch,
  }: FetchLogArgs): Promise<Log[]> {
    let eventLogs: Log[] = []

    for (let i = startBlock; i <= lastBlock; i += blocksPerBatch + 1) {
      const toBlock =
        i + blocksPerBatch >= lastBlock ? lastBlock : i + blocksPerBatch

      const logs = await this.provider.getLogs({
        ...filter,
        fromBlock: i,
        toBlock,
      })
      eventLogs = eventLogs.concat(logs)
    }

    return eventLogs
  }
}
