import { Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider, ipfsGatewayUrl } from './core'

import { Tally } from '@/utils/maci'

export async function getTally(fundingRoundAddress: string): Promise<Tally> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const tallyHash = await fundingRound.tallyHash()
  const response = await fetch(`${ipfsGatewayUrl}${tallyHash}`)
  return await response.json()
}
