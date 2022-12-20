import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { utils } from 'ethers'
import { TOPIC_ABIS } from '../abi'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RequestSubmittedParser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Partial<Project> {
    const abiInfo = TOPIC_ABIS[this.topic0]
    if (!abiInfo) {
      throw new Error(`topic ${this.topic0} not found`)
    }
    const parser = new utils.Interface([abiInfo.abi])
    const { args } = parser.parseLog(log)
    const id = args._recipientId
    const recipientIndex = args._index

    const state =
      args._type === 0 ? RecipientState.Registered : RecipientState.Removed

    const timestamp = toDate(args._timestamp)
    const createdAt =
      state === RecipientState.Registered ? timestamp : undefined
    const removedAt =
      state === RecipientState.Registered ? undefined : timestamp

    // do not update this for removal of record
    let metadata: any
    let address: string | undefined = undefined
    let name: string | undefined = undefined
    if (state === RecipientState.Registered) {
      address = args._recipient
      try {
        metadata = JSON.parse(args._metadata)
        name = metadata.name
      } catch {
        metadata = args._metadata
        name = '?'
      }
    }

    return {
      id,
      recipientIndex,
      address,
      name,
      state,
      metadata,
      createdAt,
      removedAt,
    }
  }
}
