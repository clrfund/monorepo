import { Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider, ipfsGatewayUrl } from './core'

// https://github.com/webpack/webpack/issues/7378#issuecomment-683891615
import type { Tally } from '@/utils/maci'

export { Tally }

export async function getTally(fundingRoundAddress: string): Promise<Tally> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const tallyHash = await fundingRound.tallyHash()
  const response = await fetch(`${ipfsGatewayUrl}${tallyHash}`)
  return await response.json()
}
