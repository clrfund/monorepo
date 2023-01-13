import { BaseParser } from './BaseParser'
import { TOPIC_ABIS } from '../abi'
import { RecipientAddedParser } from './RecipientAddedParser'
import { RecipientRemovedParser } from './RecipientRemovedParser'
import { RecipientAddedV1Parser } from './RecipientAddedV1Parser'
import { RecipientRemovedV1Parser } from './RecipientRemovedV1Parser'
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
      case 'RecipientAddedV1':
        return new RecipientAddedV1Parser(topic0)
      case 'RecipientRemovedV1':
        return new RecipientRemovedV1Parser(topic0)
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
