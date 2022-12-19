import { Log } from '@ethersproject/abstract-provider'
import { Project } from '../types'

export abstract class BaseParser {
  topic0: string

  constructor(topic0: string) {
    this.topic0 = topic0
  }

  abstract parse(log: Log): Partial<Project>
}

export { Log }
