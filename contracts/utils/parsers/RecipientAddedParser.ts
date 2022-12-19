import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { BigNumber, utils } from 'ethers'
import { TOPIC_ABIS } from '../constants'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RecipientAddedParser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Project {
    const abiInfo = TOPIC_ABIS[this.topic0]
    if (!abiInfo) {
      throw new Error(`topic ${this.topic0} not found`)
    }
    const parser = new utils.Interface([abiInfo.abi])
    const { args } = parser.parseLog(log)
    const id = args._recipientId
    const recipientIndex = BigNumber.from(args._index).toNumber()
    const address = args._recipient
    const addedAt = args._timestamp
    let metadata: any
    let name: string
    try {
      metadata = JSON.parse(args._metadata)
      name = metadata.name
    } catch {
      metadata = args._metadata
      name = '?'
    }
    const state = RecipientState.Accepted

    return {
      id,
      recipientIndex,
      createdAt: toDate(addedAt),
      address,
      name,
      state,
      metadata,
    }
  }
}
