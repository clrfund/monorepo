import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { utils, BigNumber, constants } from 'ethers'
import { TOPIC_ABIS } from '../constants'
import { RecipientState } from '../constants'
import { BaseParser } from './BaseParser'

function toUtf8String(hex: string): string | undefined {
  try {
    return utils.toUtf8String(hex)
  } catch {
    return undefined
  }
}

function sanitizeIpfsUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url
  }

  const regex = /^\/ipfs\//i
  return url.replace(regex, '')
}

function decodeMetadata(rawMetadata: string): any {
  // best effort to parse the rlp encoded metadata
  try {
    const decoded = utils.RLP.decode(rawMetadata)
    const utf8s = decoded.map(toUtf8String)

    const name = utf8s[0]
    const address = decoded[1]
    const bannerImageUrl = sanitizeIpfsUrl(utf8s[2])
    const description = utf8s[3]
    const websiteUrl = utf8s[4]
    const twitterUrl = utf8s[5]

    return {
      name,
      address,
      description,
      bannerImageUrl,
      websiteUrl,
      twitterUrl,
    }
  } catch {
    // ignore parsing error for now
    return undefined
  }
}

export class KlerosRecipientAddedParser extends BaseParser {
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
    const recipientIndex = BigNumber.from(args._index).toNumber()
    const state = RecipientState.Accepted
    const rawMetadata = args._metadata
    const metadata = decodeMetadata(args._metadata)
    const address = metadata?.address || constants.AddressZero
    const name = metadata?.name || '?'

    return {
      id,
      recipientIndex,
      state,
      address,
      name,
      metadata: JSON.stringify(metadata),
      rawMetadata,
    }
  }
}
