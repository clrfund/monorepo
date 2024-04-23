import { EventFilter, Log } from 'ethers'

export interface FetchLogArgs {
  filter: EventFilter
  startBlock: number
  lastBlock?: number
  blocksPerBatch: number
}

export abstract class BaseProvider {
  abstract fetchLogs(args: FetchLogArgs): Promise<Log[]>
}

export { Log }
