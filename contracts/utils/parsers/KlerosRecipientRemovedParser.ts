import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { utils } from 'ethers'
import { TOPIC_ABIS } from '../abi'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'

export class KlerosRecipientRemovedParser extends BaseParser {
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
    const state = RecipientState.Removed

    return {
      id,
      state,
    }
  }
}
