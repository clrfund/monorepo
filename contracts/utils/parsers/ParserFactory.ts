import { BaseParser } from './BaseParser'
import { TOPIC_ABIS } from '../constants'
import { RecipientAddedParser } from './RecipientAddedParser'
import { RecipientRemovedParser } from './RecipientRemovedParser'
import { KlerosRecipientAddedParser } from './KlerosRecipientAddedParser'
import { KlerosRecipientRemovedParser } from './KlerosRecipientRemovedParser'
import { RequestSubmittedParser } from './RequestSubmittedParser'
import { RequestResolvedParser } from './RequestResolvedParser'

export class ParserFactory {
  static create(topic0: string): BaseParser {
    const abiInfo = TOPIC_ABIS[topic0]

    const type = abiInfo?.type

    switch (type) {
      case 'RecipientAdded':
        return new RecipientAddedParser(topic0)
      case 'RecipientRemoved':
        return new RecipientRemovedParser(topic0)
      case 'KlerosRecipientAdded':
        return new KlerosRecipientAddedParser(topic0)
      case 'KlerosRecipientRemoved':
        return new KlerosRecipientRemovedParser(topic0)
      case 'RequestSubmitted':
        return new RequestSubmittedParser(topic0)
      case 'RequestResolved':
        return new RequestResolvedParser(topic0)
      default:
        throw new Error('Unsupported log type ' + topic0)
    }
  }
}
