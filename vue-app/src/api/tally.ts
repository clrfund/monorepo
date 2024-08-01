import { Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider, chain } from './core'

// https://github.com/webpack/webpack/issues/7378#issuecomment-683891615
import type { Tally } from '@clrfund/common'
import { getIpfsUrl } from '@/utils/url'
import { findStaticRound } from './round'

export { Tally }

export async function getTally(fundingRoundAddress: string): Promise<Tally | null> {
  let tally: Tally | null = null

  try {
    // try to get the tally file statically first, if not found, try the IPFS gateway
    const round = await findStaticRound(fundingRoundAddress, chain.name)
    if (round?.tally) {
      tally = round.tally

      // field name changes from MACI v0 to v1
      if (tally.totalVoiceCredits) {
        tally.totalSpentVoiceCredits = tally.totalVoiceCredits
      }
      if (tally.totalVoiceCreditsPerVoteOption) {
        tally.perVOSpentVoiceCredits = tally.totalVoiceCreditsPerVoteOption
      }
    }
  } catch {
    // ignore error and try to get the tally file from Ipfs gateway
  }

  if (!tally) {
    try {
      const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
      const tallyHash = await fundingRound.tallyHash()
      const response = await fetch(getIpfsUrl(tallyHash) || '')
      return await response.json()
    } catch {
      // ignore error and return null
    }
  }

  return tally
}
