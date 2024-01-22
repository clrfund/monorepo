import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RequestSubmittedParser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Partial<Project> {
    const args = this.getEventArgs(log)
    const id = args._recipientId
    const recipientIndex = args._index

    const state =
      BigInt(args._type) === BigInt(0)
        ? RecipientState.Registered
        : RecipientState.Removed

    const timestamp = toDate(args._timestamp)
    const createdAt =
      state === RecipientState.Registered ? timestamp : undefined
    const removedAt =
      state === RecipientState.Registered ? undefined : timestamp

    // do not update this for removal of record
    let metadata: any
    let recipientAddress: string | undefined = undefined
    let name: string | undefined = undefined
    if (state === RecipientState.Registered) {
      recipientAddress = args._recipient
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
      recipientAddress,
      name,
      state,
      metadata,
      createdAt,
      removedAt,
    }
  }
}
