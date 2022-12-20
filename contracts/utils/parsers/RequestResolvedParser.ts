import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { utils, BigNumber } from 'ethers'
import { TOPIC_ABIS } from '../abi'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RequestResolvedParser extends BaseParser {
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
    const timestamp = toDate(args._timestamp)

    let state =
      args._type === 1 ? RecipientState.Removed : RecipientState.Accepted

    if (args._rejected) {
      state = RecipientState.Rejected
    }

    const recipientIndex =
      state === RecipientState.Accepted
        ? BigNumber.from(args._recipientIndex).toNumber()
        : undefined
    const createdAt = state === RecipientState.Accepted ? timestamp : undefined
    const removedAt = state === RecipientState.Accepted ? undefined : timestamp

    return {
      id,
      recipientIndex,
      createdAt,
      removedAt,
      state,
    }
  }
}
