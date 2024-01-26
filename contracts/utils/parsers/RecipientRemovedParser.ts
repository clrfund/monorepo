import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'
import { toDate } from '../date'

export class RecipientRemovedParser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Partial<Project> {
    const args = this.getEventArgs(log)
    const id = args._recipientId
    const state = RecipientState.Removed
    const removedAt = toDate(args._timestamp)

    return {
      id,
      removedAt,
      state,
    }
  }
}
