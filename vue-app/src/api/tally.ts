import { Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider, ipfsGatewayUrl } from './core'

export async function getTally(fundingRoundAddress: string): Promise<any> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const tallyHash = await fundingRound.tallyHash()
  const response = await fetch(`${ipfsGatewayUrl}${tallyHash}`)
  return await response.json()
}
