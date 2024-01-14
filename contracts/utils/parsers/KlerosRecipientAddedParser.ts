import { Log } from '../providers/BaseProvider'
import { Project } from '../types'
import { toUtf8String as tryToUtf8String, decodeRlp, Interface } from 'ethers'
import { TOPIC_ABIS } from '../abi'
import { RecipientState, ZERO_ADDRESS } from '../constants'
import { BaseParser } from './BaseParser'

function toUtf8String(hex: string): string | undefined {
  try {
    return tryToUtf8String(hex)
  } catch {
    return undefined
  }
}

function sanitizeImageHash(url: string | undefined): string | undefined {
  if (!url) {
    return url
  }

  const regex = /^\/ipfs\//i
  return url.replace(regex, '')
}

function decodeMetadata(rawMetadata: string): any {
  // best effort to parse the rlp encoded metadata
  try {
    const decoded = decodeRlp(rawMetadata)
    const utf8s = decoded.map(toUtf8String)

    const name = utf8s[0]
    const recipientAddress = decoded[1]
    const imageHash = sanitizeImageHash(utf8s[2])
    const description = utf8s[3]
    const websiteUrl = utf8s[4]
    const twitterUrl = utf8s[5]

    return {
      name,
      recipientAddress,
      description,
      imageHash,
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
    const args = this.getEventArgs(log)
    const id = args._recipientId
    const recipientIndex = Number(args._index)
    const state = RecipientState.Accepted
    const rawMetadata = args._metadata
    const metadata = decodeMetadata(args._metadata)
    const recipientAddress = metadata?.recipientAddress || ZERO_ADDRESS
    const name = metadata?.name || '?'

    return {
      id,
      recipientIndex,
      state,
      recipientAddress,
      name,
      metadata,
      rawMetadata,
    }
  }
}
