import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'

export class RecipientAddedV1Parser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Project {
    const args = this.getEventArgs(log)
    const id = args._recipient
    const recipientIndex = Number(args._index)
    const recipientAddress = args._recipient
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
      recipientAddress,
      name,
      state,
      metadata,
    }
  }
}
