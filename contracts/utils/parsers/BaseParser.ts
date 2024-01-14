import { Log, Interface } from 'ethers'
import { Project } from '../types'
import { TOPIC_ABIS } from '../abi'

export abstract class BaseParser {
  topic0: string
  private parser: Interface

  constructor(topic0: string) {
    this.topic0 = topic0

    const abiInfo = TOPIC_ABIS[this.topic0]
    if (!abiInfo) {
      throw new Error(`topic ${this.topic0} not found`)
    }
    this.parser = new Interface([abiInfo.abi])
  }

  protected getEventArgs(log: Log): any {
    const parsedLog = this.parser.parseLog({
      data: log.data,
      topics: [...log.topics],
    })
    return parsedLog?.args || {}
  }

  abstract parse(log: Log): Partial<Project>
}

export { Log }
