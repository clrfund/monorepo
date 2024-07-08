import { Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider, chain } from './core'

// https://github.com/webpack/webpack/issues/7378#issuecomment-683891615
import type { Tally } from '@clrfund/common'
import { getIpfsUrl } from '@/utils/url'
import { getLeaderboardRoundInfo } from './round'

export { Tally }

export async function getTally(fundingRoundAddress: string): Promise<Tally> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const tallyHash = await fundingRound.tallyHash()

  try {
    // try to get the tally file statically first, if not found, try the IPFS gateway
    const round = await getLeaderboardRoundInfo(fundingRoundAddress, chain.name)
    if (round?.tally) {
      return round.tally
    } else {
      throw new Error('No tally data, get from IPFS gateway')
    }
  } catch {
    const response = await fetch(getIpfsUrl(tallyHash) || '')
    return await response.json()
  }
}
