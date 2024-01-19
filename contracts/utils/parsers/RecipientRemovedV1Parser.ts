import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'

export class RecipientRemovedV1Parser extends BaseParser {
  constructor(topic0: string) {
    super(topic0)
  }

  parse(log: Log): Partial<Project> {
    const args = this.getEventArgs(log)
    const id = args._recipient
    const state = RecipientState.Removed

    return {
      id,
      state,
    }
  }
}
