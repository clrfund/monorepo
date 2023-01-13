import { Contract, EventFilter, providers, constants, utils } from 'ethers'
import { ProviderFactory } from './providers/ProviderFactory'
import { Project } from './types'
import { RecipientState } from './constants'
import { ParserFactory } from './parsers/ParserFactory'
import { Log } from './providers/BaseProvider'
import { toDate } from './date'
import { EVENT_ABIS } from './abi'

function getFilter(address: string, abi: string): EventFilter {
  const eventInterface = new utils.Interface([abi])
  const events = Object.values(eventInterface.events)
  const topic0 = eventInterface.getEventTopic(events[0].name)
  return { address, topics: [topic0] }
}

function logFirstAndLastBlock(logs: Log[], type: string) {
  if (logs.length > 0) {
    console.log(
      `Fetched ${logs.length} ${type} logs from blocks ${
        logs[0].blockNumber || ''
      } to ${logs[logs.length - 1].blockNumber || ''}`
    )
  } else {
    console.log(`Logs ${type} not found`)
  }
}

export class RecipientRegistryLogProcessor {
  registry: Contract

  constructor(registry: Contract) {
    this.registry = registry
  }

  async fetchLogs({
    endBlock,
    startBlock,
    blocksPerBatch,
    etherscanApiKey,
    network,
  }: {
    recipientRegistry: Contract
    startBlock: number
    endBlock: number
    blocksPerBatch: number
    etherscanApiKey: string
    network: string
  }): Promise<Log[]> {
    // fetch event logs containing project information
    const lastBlock = endBlock
      ? endBlock
      : await this.registry.provider.getBlockNumber()

    console.log(
      `Fetching event logs from the recipient registry`,
      this.registry.address
    )

    const logProvider = ProviderFactory.createProvider({
      network,
      etherscanApiKey,
    })

    let logs: Log[] = []
    for (let i = 0; i < EVENT_ABIS.length; i++) {
      const { add, remove } = EVENT_ABIS[i]

      const filter = getFilter(this.registry.address, add.abi)
      const addLogs = await logProvider.fetchLogs({
        filter,
        startBlock,
        lastBlock,
        blocksPerBatch,
      })

      if (addLogs.length > 0) {
        const filter = getFilter(this.registry.address, remove.abi)
        const removeLogs = await logProvider.fetchLogs({
          filter,
          startBlock,
          lastBlock,
          blocksPerBatch,
        })

        logs = addLogs.concat(removeLogs)
        logFirstAndLastBlock(addLogs, add.type)
        logFirstAndLastBlock(removeLogs, remove.type)

        // done fetch, quit the loop
        break
      }
    }

    if (logs.length <= 0) {
      console.log('No event log found')
    }

    return logs
  }

  async parseLogs(logs: providers.Log[]): Promise<Record<string, Project>> {
    const recipients: Record<string, Project> = {}

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      const parser = ParserFactory.create(log.topics[0])
      let parsed: Partial<Project> = {}

      try {
        parsed = await parser.parse(log)
      } catch (err) {
        console.log('failed to parse', (err as Error).message)
      }
      const address = parsed.recipientAddress || constants.AddressZero
      const id = parsed.id || '0'

      const [block, transaction] = await Promise.all([
        this.registry.provider.getBlock(log.blockNumber),
        this.registry.provider.getTransactionReceipt(log.transactionHash),
      ])
      const blockTimestamp = toDate(block.timestamp)
      const createdAt = parsed.createdAt || blockTimestamp
      const requester = transaction.from

      if (!recipients[id]) {
        recipients[id] = {
          id,
          state: RecipientState.Registered,
          recipientAddress: address,
          requester,
          name: parsed.name,
          metadata: parsed.metadata,
          createdAt,
        }
      }

      if (parsed.state) {
        recipients[id].state = parsed.state
      }

      if (parsed.recipientIndex) {
        recipients[id].recipientIndex = parsed.recipientIndex
      }

      if (parsed.removedAt) {
        recipients[id].removedAt = parsed.removedAt
      }
    }

    return recipients
  }
}
