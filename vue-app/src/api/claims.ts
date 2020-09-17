import { BigNumber, Contract } from 'ethers'

import { FundingRound } from './abi'
import { provider } from './core'

export async function getClaimedAmount(
  fundingRoundAddress: string,
  recipientAddress: string,
): Promise<BigNumber | null> {
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, provider)
  const eventFilter = fundingRound.filters.FundsClaimed(recipientAddress)
  const events = await fundingRound.queryFilter(eventFilter, 0)
  if (events.length === 1) {
    return (events[0].args as any)._amount
  }
  return null
}
