import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RequestResolvedParser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Partial<Project> {
    const args = this.getEventArgs(log)
    const id = args._recipientId
    const timestamp = toDate(args._timestamp)

    let state =
      args._type === 1 ? RecipientState.Removed : RecipientState.Accepted

    if (args._rejected) {
      state = RecipientState.Rejected
    }

    const recipientIndex =
      state === RecipientState.Accepted
        ? Number(args._recipientIndex)
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
